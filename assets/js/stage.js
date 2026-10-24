/*
 * regret.info · hero stage
 * A small room rendered live by a path tracer on the GPU (WebGL2, no dependency).
 * Loaded with `defer` before site.js, which drives it (section 12) through `window.Stage`.
 *
 * Each frame traces one more light path per pixel and folds it into a running average
 * kept in a float texture (two textures, read one and write the other). The image starts
 * grainy and settles as samples add up. Moving the ceiling light restarts the average.
 *
 * The camera never moves. The canvas shows a window of a wide virtual frame
 * (FRAME_ASPECT), cropped exactly like `object-fit: cover` + `object-position` crop the
 * poster (assets/img/stage.*, a converged render of that frame with the light at
 * LAMP_HOME), so the live render takes over from the poster without a jump.
 */
(function () {
  'use strict';

  var FRAME_ASPECT = 2.4;            // width / height of the virtual frame and of the poster
  var FOV = 44;                      // vertical field of view, degrees
  var EYE = [0, 1.2, 2.45];
  var LOOK_AT = [0, 1.0, -2.6];
  var ROOM_LO = [-3.4, 0, -2.6];     // the room is a closed box around the camera
  var ROOM_HI = [3.4, 2.6, 2.6];
  var LAMP_HALF = [0.42, 0.28];      // half size of the ceiling light, along x and z
  var LAMP_HOME = [1.3, -0.5];       // where the light rests (x, z): above the objects, out of the frame
  var KEEP = 2;                      // when the light moves, the old image fades out over a few frames
  var EXPOSURE = { light: 2.4, dark: 0.5 };   // the dark theme keeps the same room, with the lights down

  // GLSL wants a decimal point on float literals
  function f(n) { return n % 1 === 0 ? n.toFixed(1) : String(n); }
  function v3(a) { return 'vec3(' + a.map(f).join(', ') + ')'; }
  function v2(a) { return 'vec2(' + a.map(f).join(', ') + ')'; }

  var VERT = '#version 300 es\nlayout(location = 0) in vec2 aPos;\nvoid main() { gl_Position = vec4(aPos, 0.0, 1.0); }';

  var TRACE = [
    '#version 300 es',
    'precision highp float;',
    'precision highp int;',

    'uniform sampler2D uPrev;   // running average so far',
    'uniform float uBlend;      // weight of this frame in the average: 1 / samples',
    'uniform uint uSeed;',
    'uniform vec2 uSize;        // drawing buffer, px',
    'uniform vec4 uWin;         // visible part of the frame: centre x, centre y, width, height (tangent units)',
    'uniform vec3 uEye, uFwd, uRight, uUp;',
    'uniform vec2 uLamp;        // centre of the ceiling light (x, z)',
    'out vec4 outColor;',

    'const float PI = 3.14159265;',
    'const vec3 ROOM_LO = ' + v3(ROOM_LO) + ';',
    'const vec3 ROOM_HI = ' + v3(ROOM_HI) + ';',
    'const vec2 LAMP_HALF = ' + v2(LAMP_HALF) + ';',
    'const vec3 LAMP_RGB = vec3(15.0, 14.2, 13.0);   // a slightly warm white',

    '#define MATTE 0',
    '#define GLOSS 1   // matte base under a clear coat',
    '#define MIRROR 2',
    '#define GLASS 3',
    '#define LAMP 4',

    'struct Hit { float t; vec3 n; vec3 col; int mat; float rough; };',

    // random numbers: a lowbias32 hash seeds an xorshift32 generator
    'uint rng;',
    'uint mixBits(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }',
    'float rand() { rng ^= rng << 13u; rng ^= rng >> 17u; rng ^= rng << 5u; return float(rng) * 2.3283064e-10; }',

    'vec3 inBall() {   // uniform point in the unit ball',
    '  float z = rand() * 2.0 - 1.0, a = 2.0 * PI * rand(), r = sqrt(1.0 - z * z);',
    '  return vec3(r * cos(a), r * sin(a), z) * pow(rand(), 1.0 / 3.0);',
    '}',
    'vec3 aroundNormal(vec3 n) {   // cosine-weighted direction over the hemisphere of n',
    '  float a = 2.0 * PI * rand(), r = sqrt(rand());',
    '  vec3 s = normalize(cross(abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), n));',
    '  return normalize(s * (r * cos(a)) + cross(n, s) * (r * sin(a)) + n * sqrt(max(0.0, 1.0 - r * r)));',
    '}',
    'vec3 safeDir(vec3 d) { return mix(d, vec3(1e-6), lessThan(abs(d), vec3(1e-6))); }',

    // the scene
    'void sphere(vec3 ro, vec3 rd, vec3 c, float r, vec3 col, int mat, inout Hit h) {',
    '  vec3 oc = ro - c;',
    '  float b = dot(oc, rd), d = b * b - dot(oc, oc) + r * r;',
    '  if (d < 0.0) return;',
    '  d = sqrt(d);',
    '  float t = -b - d > 1e-4 ? -b - d : -b + d;',
    '  if (t < 1e-4 || t >= h.t) return;',
    '  h = Hit(t, (ro + rd * t - c) / r, col, mat, 0.0);',
    '}',
    // a box turned by an angle around the vertical axis (cs = cos, sin of that angle)
    'void box(vec3 ro, vec3 rd, vec3 c, vec3 hs, vec2 cs, vec3 col, int mat, float rough, inout Hit h) {',
    '  vec3 o = ro - c;',
    '  o = vec3(cs.x * o.x + cs.y * o.z, o.y, cs.x * o.z - cs.y * o.x);',
    '  vec3 d = safeDir(vec3(cs.x * rd.x + cs.y * rd.z, rd.y, cs.x * rd.z - cs.y * rd.x));',
    '  vec3 a = (-hs - o) / d, b = (hs - o) / d;',
    '  vec3 lo = min(a, b), hi = max(a, b);',
    '  float tn = max(max(lo.x, lo.y), lo.z), tf = min(min(hi.x, hi.y), hi.z);',
    '  if (tn > tf || tn < 1e-4 || tn >= h.t) return;',
    '  vec3 n = -sign(d) * step(lo.yzx, lo) * step(lo.zxy, lo);',
    '  h = Hit(tn, normalize(vec3(cs.x * n.x - cs.y * n.z, n.y, cs.y * n.x + cs.x * n.z)), col, mat, rough);',
    '}',
    'void objects(vec3 ro, vec3 rd, inout Hit h) {',
    '  box(ro, rd, vec3(2.5, 0.42, -2.15), vec3(0.42), vec2(0.819, -0.574), vec3(0.5, 0.003, 0.009), GLOSS, 0.0, h);   // the red box',
    '  sphere(ro, rd, vec3(1.45, 0.5, -1.55), 0.5, vec3(0.92), MIRROR, h);',
    '  sphere(ro, rd, vec3(1.9, 0.28, -0.85), 0.28, vec3(0.98), GLASS, h);',
    '}',
    // the room: from inside a box, a ray leaves through the nearest of the three walls it heads to
    'void room(vec3 ro, vec3 rd, inout Hit h) {',
    '  vec3 d = safeDir(rd);',
    '  vec3 t = (mix(ROOM_LO, ROOM_HI, step(0.0, d)) - ro) / d;',
    '  float tm = min(t.x, min(t.y, t.z));',
    '  if (tm >= h.t) return;',
    '  vec3 p = ro + rd * tm;',
    '  if (tm == t.y && d.y > 0.0) {',
    '    bool lit = all(lessThan(abs(p.xz - uLamp), LAMP_HALF));',
    '    h = Hit(tm, vec3(0.0, -1.0, 0.0), vec3(0.8), lit ? LAMP : MATTE, 0.0);',
    '  } else if (tm == t.y) {',
    '    h = Hit(tm, vec3(0.0, 1.0, 0.0), vec3(0.3), GLOSS, 0.06);   // polished floor',
    '  } else if (tm == t.x) {',
    '    h = Hit(tm, vec3(-sign(d.x), 0.0, 0.0), vec3(0.76), MATTE, 0.0);',
    '  } else {',
    '    h = Hit(tm, vec3(0.0, 0.0, -sign(d.z)), vec3(0.78), MATTE, 0.0);',
    '  }',
    '}',
    'Hit trace(vec3 ro, vec3 rd) {',
    '  Hit h = Hit(1e9, vec3(0.0), vec3(0.0), MATTE, 0.0);',
    '  objects(ro, rd, h);',
    '  room(ro, rd, h);',
    '  return h;',
    '}',

    // light reaching p straight from a random point of the ceiling light (matte surfaces only)
    'vec3 direct(vec3 p, vec3 n) {',
    '  vec3 q = vec3(uLamp.x + (rand() * 2.0 - 1.0) * LAMP_HALF.x, ROOM_HI.y, uLamp.y + (rand() * 2.0 - 1.0) * LAMP_HALF.y);',
    '  vec3 l = q - p;',
    '  float d2 = dot(l, l), d = sqrt(d2);',
    '  l /= d;',
    '  float cs = dot(n, l), cl = l.y;',
    '  if (cs <= 0.0 || cl <= 0.0) return vec3(0.0);',
    '  Hit s = Hit(d - 1e-3, vec3(0.0), vec3(0.0), MATTE, 0.0);',
    '  objects(p, l, s);',
    '  if (s.t < d - 1e-3) return vec3(0.0);',
    '  return LAMP_RGB * (cs * cl * 4.0 * LAMP_HALF.x * LAMP_HALF.y / (d2 * PI));',
    '}',

    'vec3 radiance(vec3 ro, vec3 rd) {',
    '  vec3 sum = vec3(0.0), weight = vec3(1.0);',
    '  bool seeLamp = true;   // false right after a matte bounce, whose direct light is already counted',
    '  bool scattered = false;',
    '  for (int bounce = 0; bounce < 7; bounce++) {',
    '    Hit h = trace(ro, rd);',
    '    vec3 p = ro + rd * h.t, n = h.n;',
    '    if (h.mat == LAMP) {',
    '      // light that reached a matte surface through a mirror or glass (a caustic) is real but',
    '      // very noisy: keep each such sample dim',
    '      if (seeLamp) sum += scattered ? min(weight * LAMP_RGB, vec3(0.6)) : weight * LAMP_RGB;',
    '      break;',
    '    }',
    '    if (h.mat == MIRROR) {',
    '      rd = reflect(rd, n); ro = p + n * 1e-3; weight *= h.col; seeLamp = true;',
    '    } else if (h.mat == GLASS) {',
    '      bool entering = dot(rd, n) < 0.0;',
    '      vec3 m = entering ? n : -n;',
    '      float eta = entering ? 1.0 / 1.5 : 1.5, c = -dot(rd, m);',
    '      float k = 1.0 - eta * eta * (1.0 - c * c);',
    '      float fr = 0.04 + 0.96 * pow(1.0 - c, 5.0);',
    '      if (k < 0.0 || rand() < fr) { rd = reflect(rd, m); ro = p + m * 1e-3; }',
    '      else { rd = normalize(eta * rd + (eta * c - sqrt(k)) * m); ro = p - m * 1e-3; }',
    '      weight *= h.col; seeLamp = true;',
    '    } else {',
    '      ro = p + n * 1e-3;',
    '      float fr = h.mat == GLOSS ? 0.04 + 0.96 * pow(1.0 - max(0.0, -dot(rd, n)), 5.0) : 0.0;',
    '      if (rand() < fr) {   // the coat reflects',
    '        rd = normalize(reflect(rd, n) + h.rough * inBall());',
    '        if (dot(rd, n) <= 0.0) break;',
    '        seeLamp = true;',
    '      } else {             // the base scatters',
    '        sum += weight * h.col * direct(ro, n);',
    '        weight *= h.col;',
    '        rd = aroundNormal(n);',
    '        seeLamp = false;',
    '        scattered = true;',
    '      }',
    '    }',
    '    if (bounce > 1) {     // Russian roulette: stop dim paths early, boost the survivors',
    '      float keep = max(weight.r, max(weight.g, weight.b));',
    '      if (rand() > keep) break;',
    '      weight /= keep;',
    '    }',
    '  }',
    '  return sum;',
    '}',

    'void main() {',
    '  rng = mixBits(uint(gl_FragCoord.x) + mixBits(uint(gl_FragCoord.y) + mixBits(uSeed))) | 1u;',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 + vec2(rand(), rand())) / uSize;',
    '  vec2 tn = uWin.xy + (uv - 0.5) * uWin.zw;',
    '  vec3 c = radiance(uEye, normalize(uFwd + uRight * tn.x + uUp * tn.y));',
    '  float peak = max(c.r, max(c.g, c.b));',
    '  if (peak > 10.0) c *= 10.0 / peak;   // rare, very bright paths would speckle the first frames',
    '  outColor = vec4(mix(texelFetch(uPrev, ivec2(gl_FragCoord.xy), 0).rgb, c, uBlend), 1.0);',
    '}'
  ].join('\n');

  // tone mapping: exponential curve, then the sRGB transfer, with a little dither against banding
  var SHOW = [
    '#version 300 es',
    'precision highp float;',
    'uniform sampler2D uAcc;',
    'uniform float uExposure;',
    'out vec4 outColor;',
    'void main() {',
    '  vec3 c = 1.0 - exp(-texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0).rgb * uExposure);',
    '  c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));',
    '  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);',
    '  outColor = vec4(c + (n - 0.5) / 255.0, 1.0);',
    '}'
  ].join('\n');

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function unit(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // The result is checked later (Stage#ready): a driver that compiles in the background
  // (KHR_parallel_shader_compile) then never blocks the page.
  function compile(gl, vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    });
    gl.linkProgram(p);
    return p;
  }

  function uniforms(gl, p, names) {
    var u = {};
    names.forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    return u;
  }

  // Throws when the browser cannot run it (no WebGL2, or no float render targets).
  function Stage(canvas) {
    var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('WebGL2 with float render targets is not available');
    this.gl = gl;
    this.canvas = canvas;
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    this.trace = compile(gl, VERT, TRACE);
    this.show = compile(gl, VERT, SHOW);
    this.linked = false;

    // one triangle that covers the viewport
    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var fwd = unit(sub(LOOK_AT, EYE)), right = unit(cross(fwd, [0, 1, 0]));
    this.cam = { fwd: fwd, right: right, up: cross(right, fwd) };

    this.buf = [];
    this.read = 0;
    this.samples = 0;
    this.seed = 1;
    this.exposure = EXPOSURE.light;
    this.lamp = LAMP_HOME.slice();
    this.win = [0, 0, 1, 1];
    this.width = this.height = 0;
  }

  Stage.FRAME_ASPECT = FRAME_ASPECT;
  Stage.LAMP_HOME = LAMP_HOME;

  // True once the shaders are built (poll it once per frame). Throws if they failed.
  Stage.prototype.ready = function () {
    if (this.linked) return true;
    var gl = this.gl, ext = this.parallel, progs = [this.trace, this.show];
    if (ext && !progs.every(function (p) { return gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR); })) return false;
    progs.forEach(function (p) {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'shader link failed');
    });
    this.ut = uniforms(gl, this.trace, ['uPrev', 'uBlend', 'uSeed', 'uSize', 'uWin', 'uEye', 'uFwd', 'uRight', 'uUp', 'uLamp']);
    this.us = uniforms(gl, this.show, ['uAcc', 'uExposure']);
    gl.useProgram(this.trace);
    gl.uniform3fv(this.ut.uEye, EYE);
    gl.uniform3fv(this.ut.uFwd, this.cam.fwd);
    gl.uniform3fv(this.ut.uRight, this.cam.right);
    gl.uniform3fv(this.ut.uUp, this.cam.up);
    return (this.linked = true);
  };

  // Sizes the drawing buffer (css px × ratio) and picks the window of the frame it shows:
  // fx, fy are the poster's object-position as fractions (0.5 0.5 = centred).
  Stage.prototype.resize = function (cssW, cssH, ratio, fx, fy) {
    var gl = this.gl, w = Math.max(1, Math.round(cssW * ratio)), h = Math.max(1, Math.round(cssH * ratio));
    var H = 2 * Math.tan(FOV * Math.PI / 360), W = H * FRAME_ASPECT, a = cssW / Math.max(1, cssH);
    var ww = a <= FRAME_ASPECT ? H * a : W, wh = a <= FRAME_ASPECT ? H : W / a;
    this.win = [-W / 2 + ww / 2 + fx * (W - ww), H / 2 - wh / 2 - fy * (H - wh), ww, wh];
    this.samples = 0;
    if (w === this.width && h === this.height) return;
    this.width = this.canvas.width = w;
    this.height = this.canvas.height = h;
    this.buf.forEach(function (b) { gl.deleteTexture(b.tex); gl.deleteFramebuffer(b.fb); });
    this.buf = [0, 1].map(function () {
      var tex = gl.createTexture(), fb = gl.createFramebuffer();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('float framebuffer');
      return { tex: tex, fb: fb };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  // Where the light goes for a point of the canvas (u, v from its top left, 0 to 1): on the
  // ceiling, straight above the spot of the room seen under that point (floor, wall or ceiling).
  Stage.prototype.aim = function (u, v) {
    var c = this.cam, w = this.win, tx = w[0] + (u - 0.5) * w[2], ty = w[1] - (v - 0.5) * w[3], t = Infinity, m = 0.04;
    var d = [0, 1, 2].map(function (i) { return c.fwd[i] + c.right[i] * tx + c.up[i] * ty; });
    for (var i = 0; i < 3; i++) if (d[i]) t = Math.min(t, ((d[i] > 0 ? ROOM_HI[i] : ROOM_LO[i]) - EYE[i]) / d[i]);
    return [
      clamp(EYE[0] + d[0] * t, ROOM_LO[0] + LAMP_HALF[0] + m, ROOM_HI[0] - LAMP_HALF[0] - m),
      clamp(EYE[2] + d[2] * t, ROOM_LO[2] + LAMP_HALF[1] + m, ROOM_HI[2] - LAMP_HALF[1] - m)
    ];
  };

  // Theme: same render, another exposure. Redraws at once, even when the render has settled.
  Stage.prototype.setDark = function (dark) {
    this.exposure = dark ? EXPOSURE.dark : EXPOSURE.light;
    if (this.samples && this.linked) this.present(this.buf[this.read]);
  };

  Stage.prototype.moveLamp = function (x, z) {
    if (Math.abs(x - this.lamp[0]) < 1e-4 && Math.abs(z - this.lamp[1]) < 1e-4) return;
    this.lamp = [x, z];
    this.samples = Math.min(this.samples, KEEP);
  };

  // Traces one more sample per pixel and shows the average.
  Stage.prototype.render = function () {
    var gl = this.gl, from = this.buf[this.read], to = this.buf[1 - this.read];
    if (!from || !this.ready()) return;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.trace);
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.tex);
    gl.uniform1i(this.ut.uPrev, 0);
    gl.uniform1f(this.ut.uBlend, 1 / (this.samples + 1));
    gl.uniform1ui(this.ut.uSeed, this.seed = (this.seed + 1) >>> 0);
    gl.uniform2f(this.ut.uSize, this.width, this.height);
    gl.uniform4fv(this.ut.uWin, this.win);
    gl.uniform2fv(this.ut.uLamp, this.lamp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.read = 1 - this.read;
    this.samples++;
    this.present(to);
  };

  // Tone maps the average to the canvas.
  Stage.prototype.present = function (src) {
    var gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.show);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(this.us.uAcc, 0);
    gl.uniform1f(this.us.uExposure, this.exposure);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  window.Stage = Stage;
})();

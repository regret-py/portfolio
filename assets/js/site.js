/*
 * regret.info · site script
 * Plain JavaScript, no build step, no dependency. Loaded with `defer`.
 *
 * 1. config & helpers      5. avatar reveal       9. Discord presence
 * 2. i18n (EN in the DOM)  6. WaveDeck mixer     10. visit counter (silent)
 * 3. theme                 7. GitHub graph       11. assistant (flockopops)
 * 4. nav                   8. contact
 */
(function () {
  'use strict';

  /* ===================== 1. config & helpers ===================== */
  var CONFIG = {
    email: 'julien.roullet@proton.me',
    discordId: '173290719316934659',
    github: 'regret-py',
    timeZone: 'Europe/Paris',
    chat: true,          // false removes the assistant from the page
    chatApi: '',         // '/api/chat' once deployed on Vercel with GROQ_API_KEY; empty = scripted answers only (GitHub Pages)
    countViews: true,    // anonymous visit counter, never displayed
    host: 'regret.info'  // visits are only counted on this host
  };

  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;
  function $(id) { return document.getElementById(id); }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  var live = $('live');
  function announce(msg) { if (!live) return; live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }

  // Same defaults as the inline boot script, in case it was blocked (e.g. outdated CSP hash).
  if (!root.classList.contains('js')) {
    root.classList.add('js');
    var t0 = load('theme');
    if (t0 !== 'light' && t0 !== 'dark') t0 = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    root.setAttribute('data-theme', t0);
    var l0 = load('lang');
    if (l0 !== 'fr' && l0 !== 'en') l0 = /^fr\b/i.test(navigator.language || '') ? 'fr' : 'en';
    root.lang = l0;
  }
  root.classList.add('anim');

  /* ===================== 2. i18n ===================== */
  // English lives in the HTML (what search engines index). French overrides it here.
  // Typography: U+00A0 before ":" and U+202F before ";", "?" and "!".
  var T = { fr: {
    doc_title: 'Julien · Développeur web et desktop, Paris',
    doc_desc: 'Julien, développeur web et desktop basé à Paris. Étudiant en 1re année à Epitech, il développe WaveDeck, une table de mixage audio virtuelle pour Windows. Copropriétaire de mush.rip.',
    skip: 'Aller au contenu',
    home_aria: 'Julien, accueil', nav_aria: 'Navigation principale', lang_group: 'Langue',
    nav_projects: 'projets', nav_skills: 'compétences', nav_bg: 'parcours', nav_contact: 'contact',
    role: 'développeur\u00a0· Paris',
    mast_field: 'Développement web et desktop', mast_geo: '48,86°\u00a0N, 2,35°\u00a0E',
    hero_h: 'Je développe des applications web et desktop. <span class="nw">En ce moment,</span> une <em>table de mixage audio</em> pour Windows.',
    hero_p: 'Étudiant en 1<sup>re</sup> année à <a class="u" href="https://www.epitech.eu/" target="_blank" rel="noopener">Epitech Paris</a>, au sein du Programme Grande École (PGE). Je suis également copropriétaire de <a class="u" href="https://mush.rip" target="_blank" rel="noopener">mush.rip</a>, une plateforme link-in-bio, où je m’occupe du produit et des opérations.',
    avail: 'Disponible pour un stage, une mission freelance ou une collaboration',
    cta_mail: 'Écrire un e-mail', cta_cv: 'CV sur demande',
    cv_href: 'mailto:julien.roullet@proton.me?subject=Demande%20de%20CV',
    now: 'en ce moment', wip: 'en développement',
    wd_p1: 'Une table de mixage virtuelle et modulaire pour Windows, ma propre version de Voicemeeter.',
    wd_p2: 'Un moteur audio central s’appuie sur le périphérique principal, qui sert d’horloge maître. Les tranches de mixage s’empilent dessus, les périphériques d’entrée et de sortie supplémentaires y sont raccordés par des tampons circulaires, et des plugins VST3 peuvent être insérés dans la chaîne de traitement.',
    sp_platform: 'plateforme', sp_lang: 'langage',
    sp_plugins_v: 'VST3, chargés avec Pedalboard', sp_code_v: 'pas encore public',
    wd_link: 'Me contacter au sujet de WaveDeck →',
    wd_fig: 'fig. 1\u00a0: maquette jouable. Faites glisser les faders, appuyez sur M (muet) ou S (solo).',
    mush_meta: 'copropriétaire\u00a0· depuis\u00a02025',
    mush_desc: 'Plateforme link-in-bio\u00a0: une page unique qui réunit les liens, les réseaux sociaux et les statistiques d’une personne. Une petite équipe la développe\u202f; en tant que copropriétaire, je m’occupe du produit et des opérations.',
    side: 'projet personnel',
    flock_desc: 'Application de messagerie en temps réel, écrite de zéro\u00a0: échanges par WebSocket, authentification JWT et stockage SQLite.',
    community: 'communauté\u00a0· bot Discord',
    wing_desc: 'Une communauté <span class="nw">Counter-Strike 2</span> et son bot Discord\u00a0: matchmaking, tournois et protection anti-raid.',
    sk_lang: 'langages', sk_desk: 'desktop et audio', sk_front: 'front-end', sk_back: 'back-end', sk_tools: 'outils', sk_learn: 'en apprentissage',
    sk_front_v: 'HTML, CSS, React, référencement technique (SEO)',
    sk_learn_v: 'Le C, l’environnement Unix et la gestion de la mémoire, à Epitech',
    gh_h: 'Activité GitHub', gh_sub: 'contributions sur les 12 derniers mois', gh_less: 'moins', gh_more: 'plus',
    d1: 'sept. 2026 – aujourd’hui', d2: '2025 – aujourd’hui',
    r1: 'Programme Grande École (PGE), 1<sup>re</sup> année',
    r2: 'Copropriétaire, produit et opérations, à distance',
    r3: 'Spécialité Systèmes d’information et numérique (SIN)',
    cv: 'CV complet sur demande →',
    off_h: 'hors écran',
    off_p: 'En dehors du clavier\u00a0: l’automobile, le skate et le catamaran. Et <span class="nw">Counter-Strike 2</span>, d’où est né Wingman.',
    img_car: 'Un coupé sportif bleu en courbe sur un circuit', img_skate: 'Trois skateboards dans un train', img_sail: 'Un catamaran en mer, une coque levée',
    cap_car: 'fig. 2\u00a0: sur circuit', cap_skate: 'fig. 3\u00a0: skate', cap_sail: 'fig. 4\u00a0: catamaran',
    ct_p: 'Pour un stage, une mission freelance ou une question sur WaveDeck, le plus simple est de m’écrire par e-mail.',
    copy: 'copier', copied: 'copié',
    ct_based: 'basé à', ct_city: 'Paris, France',
    src: 'code source ↗', totop: 'haut de page ↑',
    colophon: 'Composé en IBM Plex. Écrit à la main, sans framework.',
    fc_open: 'Une question\u202f?', fc_close: 'Fermer',
    fc_sub: 'assistant automatisé',
    fc_note: 'Réponses automatiques, parfois incomplètes.',
    fc_label: 'Votre question', fc_ph: 'Posez une question sur Julien…', fc_send: 'envoyer'
  } };

  // strings only used from JS
  var S = {
    en: {
      theme_to_light: 'Switch to light theme', theme_to_dark: 'Switch to dark theme',
      av_show: 'Show photo', av_hide: 'Show illustration',
      online: 'online', idle: 'away', dnd: 'do not disturb', offline: 'offline',
      cell_one: 'contribution', cell_many: 'contributions', no_contrib: 'No contributions',
      recent: ', {n} in the last 30 days',
      copy_aria: 'Copy email address', copied_live: 'Email address copied',
      mute: 'Mute', solo: 'Solo', fader: 'fader', pan: 'pan', running: 'RUNNING', muted: 'MUTED',
      mixer: 'WaveDeck mixer, playable mock-up'
    },
    fr: {
      theme_to_light: 'Passer au thème clair', theme_to_dark: 'Passer au thème sombre',
      av_show: 'Afficher la photo', av_hide: 'Afficher l’illustration',
      online: 'en ligne', idle: 'absent', dnd: 'ne pas déranger', offline: 'hors ligne',
      cell_one: 'contribution', cell_many: 'contributions', no_contrib: 'Aucune contribution',
      recent: ', dont {n} ces 30 derniers jours',
      copy_aria: 'Copier l’adresse e-mail', copied_live: 'Adresse e-mail copiée',
      mute: 'Muet', solo: 'Solo', fader: 'fader', pan: 'panoramique', running: 'EN MARCHE', muted: 'MUET',
      mixer: 'Table de mixage WaveDeck, maquette jouable'
    }
  };

  var lang = root.lang === 'fr' ? 'fr' : 'en';
  function s(k) { return (S[lang] && S[lang][k]) || S.en[k]; }
  function locale() { return lang === 'fr' ? 'fr-FR' : 'en-GB'; }
  var ATTRS = { 'data-i18n-aria': 'aria-label', 'data-i18n-title': 'title', 'data-i18n-alt': 'alt', 'data-i18n-ph': 'placeholder', 'data-i18n-href': 'href' };
  var metaDesc = document.querySelector('meta[name="description"]');
  var EN_TITLE = document.title, EN_DESC = metaDesc ? metaDesc.content : '';
  var langHooks = [];
  function onLang(fn) { langHooks.push(fn); }

  function applyLang(l) {
    lang = l === 'fr' ? 'fr' : 'en';
    root.lang = lang;
    var fr = lang === 'fr' ? T.fr : {};
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent);
      var k = el.getAttribute('data-i18n');
      el.textContent = fr[k] != null ? fr[k] : el.getAttribute('data-en');
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-html]'), function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.innerHTML);
      var k = el.getAttribute('data-i18n-html');
      el.innerHTML = fr[k] != null ? fr[k] : el.getAttribute('data-en');
    });
    Object.keys(ATTRS).forEach(function (a) {
      var attr = ATTRS[a], bk = 'data-en-' + attr;
      [].forEach.call(document.querySelectorAll('[' + a + ']'), function (el) {
        if (!el.hasAttribute(bk)) el.setAttribute(bk, el.getAttribute(attr) || '');
        var k = el.getAttribute(a);
        el.setAttribute(attr, fr[k] != null ? fr[k] : el.getAttribute(bk));
      });
    });
    document.title = lang === 'fr' ? T.fr.doc_title : EN_TITLE;
    if (metaDesc) metaDesc.content = lang === 'fr' ? T.fr.doc_desc : EN_DESC;
    [].forEach.call(document.querySelectorAll('#langSwitch [data-l]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-l') === lang ? 'true' : 'false');
    });
    langHooks.forEach(function (fn) { fn(); });
  }
  [].forEach.call(document.querySelectorAll('#langSwitch [data-l]'), function (b) {
    b.addEventListener('click', function () {
      var n = b.getAttribute('data-l');
      if (n === lang) return;
      store('lang', n);
      applyLang(n);
    });
  });

  /* ===================== 3. theme ===================== */
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var themeBtn = $('themeBtn');
  function paintTheme(t) {
    root.setAttribute('data-theme', t);
    if (metaTheme) metaTheme.content = t === 'dark' ? '#0a0e1b' : '#e8edf1';
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? s('theme_to_light') : s('theme_to_dark'));
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store('theme', t);
    paintTheme(t);
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) { if (!load('theme')) paintTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
  }
  onLang(function () { paintTheme(root.getAttribute('data-theme') || 'light'); });

  /* ===================== 4. nav: highlight the section in view ===================== */
  var navLinks = [].slice.call(document.querySelectorAll('.nlinks a[href^="#"]'));
  if (hasIO && navLinks.length) {
    var vis = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var cur = null;
      navLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (vis[id] && !cur) cur = a; });
      navLinks.forEach(function (a) {
        var on = a === cur;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var sec = $(a.getAttribute('href').slice(1)); if (sec) spy.observe(sec); });
  }

  /* ===================== 5. avatar: illustration → photo ===================== */
  (function () {
    var aw = $('avatar'), grid = $('avGrid');
    if (!aw || !grid) return;
    // 6×6 tiles, each revealed after its own delay (multiples of 24 ms)
    var ORDER = [14, 25, 21, 32, 31, 3, 23, 17, 6, 34, 2, 27, 9, 20, 8, 13, 24, 29, 26, 15, 35, 18, 11, 7, 1, 33, 30, 5, 10, 4, 16, 0, 28, 22, 12, 19];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 36; i++) {
      var c = document.createElement('span'), x = i % 6, y = (i / 6) | 0;
      c.className = 'av-cube';
      c.style.left = (x * 100 / 6) + '%';
      c.style.top = (y * 100 / 6) + '%';
      c.style.backgroundPosition = (x * 20) + '% ' + (y * 20) + '%';
      c.style.transitionDelay = (ORDER[i] * 24) + 'ms';
      frag.appendChild(c);
    }
    grid.appendChild(frag);
    aw.setAttribute('role', 'button');
    aw.tabIndex = 0;
    function label() {
      var on = aw.classList.contains('revealed');
      aw.setAttribute('aria-pressed', on ? 'true' : 'false');
      aw.setAttribute('aria-label', s('av_show'));
    }
    function flip() { aw.classList.toggle('revealed'); label(); }
    aw.addEventListener('click', flip);
    aw.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    label();
    onLang(label);
  })();

  /* ===================== 6. WaveDeck mixer (playable mock-up) ===================== */
  (function () {
    var mixer = document.querySelector('.mixer');
    if (!mixer) return;
    var stateEl = $('mxState');
    var MAX = 0.9; // the cap travels from 0 to 90 % of the track
    function dbOf(p) { return p < 0.04 ? -Infinity : (p - 0.78) * 40; }
    function dbText(d) { return d === -Infinity ? '-∞' : (d > 0 ? '+' : '') + d.toFixed(1); }
    var strips = [].slice.call(mixer.querySelectorAll('.strip')).map(function (st) {
      var cap = st.querySelector('.cap'), knob = st.querySelector('.knob');
      var o = {
        name: st.querySelector('.slabel').textContent, master: st.classList.contains('strip--master'),
        fader: st.querySelector('.fader'), cap: cap, knob: knob,
        meter: st.querySelector('.meter i'), clip: st.querySelector('.clip'), db: st.querySelector('.db'),
        m: st.querySelector('.m'), s: st.querySelector('.s'),
        pos: parseFloat(cap.style.bottom) / 100, rot: parseFloat(knob.style.getPropertyValue('--rot')) || 0
      };
      o.pos0 = o.pos; o.rot0 = o.rot;
      return o;
    });
    function label() {
      strips.forEach(function (o) {
        o.fader.setAttribute('aria-label', o.name + ' ' + s('fader'));
        o.knob.setAttribute('aria-label', o.name + ' ' + s('pan'));
        o.m.setAttribute('aria-label', s('mute') + ' ' + o.name);
        o.s.setAttribute('aria-label', s('solo') + ' ' + o.name);
      });
      mixer.setAttribute('aria-label', s('mixer'));
    }
    function update() {
      var soloOn = strips.some(function (o) { return !o.master && o.s.classList.contains('on'); });
      var master = null, sum = 0, n = 0;
      strips.forEach(function (o) {
        var d = dbOf(o.pos), muted = o.m.classList.contains('on');
        o.cap.style.bottom = (o.pos * 100).toFixed(1) + '%';
        o.db.textContent = muted ? '-∞' : dbText(d);
        o.fader.setAttribute('aria-valuenow', Math.round(o.pos / MAX * 100));
        o.fader.setAttribute('aria-valuetext', (muted ? s('muted') + ', ' : '') + dbText(d) + ' dB');
        o.knob.style.setProperty('--rot', o.rot + 'deg');
        o.knob.setAttribute('aria-valuenow', Math.round(o.rot));
        if (o.master) { master = o; return; }
        var silent = muted || (soloOn && !o.s.classList.contains('on'));
        o.g = silent ? 0 : Math.min(1.15, o.pos / 0.78);
        o.meter.style.setProperty('--g', o.g.toFixed(3));
        o.clip.classList.toggle('on', !silent && d > 0.5);
        sum += o.g; n++;
      });
      if (master) {
        var mg = master.m.classList.contains('on') ? 0 : Math.min(1.15, master.pos / 0.78) * Math.min(1, sum / Math.max(1, n) * 1.6);
        master.meter.style.setProperty('--g', mg.toFixed(3));
        master.clip.classList.toggle('on', mg > 1.02);
        var off = mg < 0.02;
        mixer.classList.toggle('off', off);
        if (stateEl) stateEl.textContent = off ? s('muted') : s('running');
      }
    }
    function drag(el, onMove) {
      el.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        e.preventDefault();
        el.focus({ preventScroll: true });
        el.setPointerCapture(e.pointerId);
        el.classList.add('drag');
        onMove(e, true);
        function mv(ev) { onMove(ev, false); }
        function up() {
          el.classList.remove('drag');
          el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        }
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    }
    strips.forEach(function (o) {
      // fader: drag or click to set, arrow keys, double-click to reset
      var f = o.fader;
      f.setAttribute('role', 'slider'); f.tabIndex = 0;
      f.setAttribute('aria-valuemin', '0'); f.setAttribute('aria-valuemax', '100'); f.setAttribute('aria-orientation', 'vertical');
      drag(f, function (e) {
        var r = f.getBoundingClientRect();
        o.pos = Math.max(0, Math.min(MAX, (r.bottom - e.clientY - o.cap.offsetHeight / 2) / r.height));
        update();
      });
      f.addEventListener('dblclick', function () { o.pos = o.pos0; update(); });
      f.addEventListener('keydown', function (e) {
        var st = { ArrowUp: .02, ArrowRight: .02, ArrowDown: -.02, ArrowLeft: -.02, PageUp: .1, PageDown: -.1 }[e.key];
        if (e.key === 'Home') o.pos = 0;
        else if (e.key === 'End') o.pos = MAX;
        else if (st) o.pos = Math.max(0, Math.min(MAX, o.pos + st));
        else return;
        e.preventDefault(); update();
      });
      // knob: vertical drag, arrow keys, double-click to reset
      var k = o.knob, y0 = 0, r0 = 0;
      k.setAttribute('role', 'slider'); k.tabIndex = 0;
      k.setAttribute('aria-valuemin', '-135'); k.setAttribute('aria-valuemax', '135');
      drag(k, function (e, first) {
        if (first) { y0 = e.clientY; r0 = o.rot; }
        o.rot = Math.max(-135, Math.min(135, r0 + (y0 - e.clientY) * 2.2));
        update();
      });
      k.addEventListener('dblclick', function () { o.rot = o.rot0; update(); });
      k.addEventListener('keydown', function (e) {
        var st = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10 }[e.key];
        if (!st) return;
        e.preventDefault(); o.rot = Math.max(-135, Math.min(135, o.rot + st)); update();
      });
      // mute / solo
      [o.m, o.s].forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.classList.toggle('on');
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          update();
        });
      });
    });
    mixer.setAttribute('role', 'group');
    label(); update();
    onLang(function () { label(); update(); });
  })();

  /* ===================== 7. GitHub contributions ===================== */
  (function () {
    var grid = $('ghGrid'), months = $('ghMonths'), countEl = $('ghCount'), recentEl = $('ghRecent');
    if (!grid || !months) return;
    var inks = ['var(--rule)', 'color-mix(in srgb,var(--text) 28%,transparent)', 'color-mix(in srgb,var(--text) 50%,transparent)', 'color-mix(in srgb,var(--text) 74%,transparent)', 'var(--text)'];
    var current = null;
    function fmt(n) { return Number(n || 0).toLocaleString(locale()); }
    function render(data) {
      current = data;
      var mFmt = new Intl.DateTimeFormat(locale(), { month: 'short', timeZone: 'UTC' });
      var dFmt = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      var frag = document.createDocumentFragment(), mfrag = document.createDocumentFragment();
      var start = new Date(data.start + 'T00:00:00Z'), pad = start.getUTCDay();
      var lv = String(data.levels), n = lv.length, counts = data.counts || null;
      var cols = Math.ceil((pad + n) / 7), i, c;
      function blank() { var e = document.createElement('div'); e.className = 'cell'; e.style.visibility = 'hidden'; frag.appendChild(e); }
      for (i = 0; i < pad; i++) blank();
      for (i = 0; i < n; i++) {
        var d = new Date(start.getTime() + i * 864e5), cnt = counts ? counts[i] : null;
        c = document.createElement('div');
        c.className = 'cell';
        c.style.background = inks[+lv[i] || 0];
        c.title = (cnt == null ? '' : (cnt ? fmt(cnt) + ' ' + (cnt === 1 ? s('cell_one') : s('cell_many')) : s('no_contrib')) + ' · ') + dFmt.format(d);
        frag.appendChild(c);
      }
      for (i = 0; i < (7 - ((pad + n) % 7)) % 7; i++) blank();
      grid.innerHTML = ''; grid.appendChild(frag);
      months.innerHTML = '';
      months.style.display = 'grid'; months.style.gap = '3px'; months.style.gridTemplateColumns = 'repeat(' + cols + ',11px)';
      var prev = -1, labels = [];
      for (var w = 0; w < cols; w++) {
        // a column gets a label when its Sunday falls in a new month
        var dt = new Date(start.getTime() + Math.max(0, (w * 7) - pad) * 864e5), m = dt.getUTCMonth();
        if (m !== prev) { labels.push({ w: w, t: mFmt.format(dt).replace('.', '') }); prev = m; }
      }
      labels.forEach(function (l, i) {
        var next = labels[i + 1];
        if (next && next.w - l.w < 3) return; // too close to the next month: GitHub drops it too
        var sp = document.createElement('span');
        sp.textContent = l.t;
        sp.style.gridColumn = String(l.w + 1);
        mfrag.appendChild(sp);
      });
      months.appendChild(mfrag);
      if (countEl) countEl.textContent = fmt(data.total);
      if (recentEl) {
        var recent = 0;
        if (counts) for (i = Math.max(0, n - 30); i < n; i++) recent += counts[i] || 0;
        recentEl.textContent = '';
        if (counts && recent > 0 && recent < data.total) {
          var parts = s('recent').split('{n}'), b = document.createElement('b');
          b.className = 'num'; b.textContent = fmt(recent);
          recentEl.appendChild(document.createTextNode(parts[0]));
          recentEl.appendChild(b);
          recentEl.appendChild(document.createTextNode(parts[1] || ''));
        }
      }
      requestAnimationFrame(function () { grid.scrollLeft = grid.scrollWidth; months.scrollLeft = grid.scrollLeft; });
    }
    // Snapshot used until the live data arrives (or if the API is down).
    var SNAP = {"start":"2025-09-28","levels":"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041240010000000100000000010044242132120","nz":"331:8,332:2,333:4,334:8,337:2,345:1,355:2,358:26,359:13,360:4,361:9,362:3,363:2,364:6,365:3,366:2,367:3","total":98};
    if (SNAP) {
      var counts = [];
      for (var i = 0; i < SNAP.levels.length; i++) counts.push(0);
      SNAP.nz.split(',').forEach(function (p) { var kv = p.split(':'); counts[+kv[0]] = +kv[1]; });
      render({ start: SNAP.start, levels: SNAP.levels, counts: counts, total: SNAP.total });
    }
    onLang(function () { if (current) render(current); });
    grid.addEventListener('scroll', function () { months.scrollLeft = grid.scrollLeft; }, { passive: true });
    addEventListener('resize', function () { grid.scrollLeft = grid.scrollWidth; months.scrollLeft = grid.scrollWidth; }, { passive: true });
    fetch('https://github-contributions-api.jogruber.de/v4/' + CONFIG.github + '?y=last')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var c = (d && d.contributions) || [];
        if (!c.length) return;
        render({
          start: c[0].date,
          levels: c.map(function (x) { return x.level; }).join(''),
          counts: c.map(function (x) { return x.count; }),
          total: (d.total && d.total.lastYear) || c.reduce(function (a, x) { return a + (x.count || 0); }, 0)
        });
      })
      .catch(function () {});
  })();

  /* ===================== 8. contact: copy address, local time ===================== */
  (function () {
    var cp = $('copyEmail');
    if (cp && (navigator.clipboard || document.queryCommandSupported && document.queryCommandSupported('copy'))) {
      cp.hidden = false;
      var label = function () { cp.setAttribute('aria-label', s('copy_aria')); };
      var done = function () {
        cp.classList.add('ok'); announce(s('copied_live'));
        clearTimeout(cp._t); cp._t = setTimeout(function () { cp.classList.remove('ok'); }, 1600);
      };
      var legacy = function () {
        var ta = document.createElement('textarea');
        ta.value = CONFIG.email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove(); if (ok) done();
      };
      cp.addEventListener('click', function () {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(CONFIG.email).then(done, legacy);
        else legacy();
      });
      label(); onLang(label);
    }

    var clock = $('clock');
    if (clock && window.Intl) {
      var tick = function () {
        var now = new Date(), t, off = '';
        try {
          t = new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: CONFIG.timeZone }).format(now);
        } catch (e) { return; }
        try {
          var part = new Intl.DateTimeFormat('en-US', { timeZone: CONFIG.timeZone, timeZoneName: 'shortOffset' })
            .formatToParts(now).filter(function (p) { return p.type === 'timeZoneName'; })[0];
          if (part) off = ' (' + part.value.replace('GMT', 'UTC') + ')';
        } catch (e) {}
        clock.textContent = ' · ' + t + off;
      };
      tick(); setInterval(tick, 30000); onLang(tick);
    }

    var yr = $('year');
    if (yr) yr.textContent = new Date().getFullYear();
  })();

  /* ===================== 9. Discord presence (Lanyard) ===================== */
  // Shows the status only (no activity). Needs the account to be in the Lanyard server.
  (function () {
    var pres = $('dPres'), dot = $('dDot'), act = $('dAct');
    if (!pres || !/^\d{16,20}$/.test(CONFIG.discordId)) return;
    var COLORS = { online: '#3ba55d', idle: '#faa61a', dnd: '#ed4245', offline: '#747f8d' }, status = null;
    function paint() {
      if (!status) return;
      dot.style.background = COLORS[status];
      act.textContent = s(status);
      pres.hidden = false;
    }
    function poll() {
      if (document.hidden) return;
      fetch('https://api.lanyard.rest/v1/users/' + CONFIG.discordId)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (j) {
          if (!j || !j.success || !j.data) return;
          status = COLORS[j.data.discord_status] ? j.data.discord_status : 'offline';
          paint();
        })
        .catch(function () {});
    }
    poll();
    setInterval(poll, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
    onLang(paint);
  })();

  /* ===================== 10. visit counter (silent) ===================== */
  // Counts one visit per session on the production host. Nothing is displayed.
  // Read the total at https://abacus.jasoncameron.dev/get/julien-roullet-portfolio/views
  (function () {
    if (!CONFIG.countViews || location.hostname !== CONFIG.host || navigator.webdriver) return;
    try { if (sessionStorage.getItem('v_counted') === '1') return; } catch (e) {}
    fetch('https://abacus.jasoncameron.dev/hit/julien-roullet-portfolio/views')
      .then(function (r) { if (r.ok) { try { sessionStorage.setItem('v_counted', '1'); } catch (e) {} } })
      .catch(function () {});
  })();

  /* ===================== 11. assistant (flockopops) ===================== */
  // Uses CONFIG.chatApi (Groq proxy, see api/chat.js) when set; otherwise, or if it fails, the scripted answers below.
  (function () {
    var fab = $('fcOpen'), panel = $('fcPanel');
    if (!fab || !panel) return;
    if (!CONFIG.chat) { fab.remove(); panel.remove(); return; }
    var msgs = $('fcMsgs'), chips = $('fcChips'), form = $('fcForm'), text = $('fcText'), send = $('fcSend'), xbtn = $('fcClose');
    var MAIL = '<a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>';
    var GH = '<a href="https://github.com/' + CONFIG.github + '" target="_blank" rel="noopener">' + CONFIG.github + '</a>';

    // Generic entries (who, thanks) come last: on a tie, the more specific answer wins.
    var KB = [
      { w: 2, k: ['wavedeck', 'wave', 'audio', 'voicemeeter', 'mix', 'mixer', 'mixage', 'sound', 'vst', 'vst3'],
        en: 'WaveDeck is a modular virtual audio mixer for Windows, Julien’s own take on Voicemeeter. It is written in Python with PySide6, uses sounddevice for audio and Pedalboard to host VST3 plugins. The code is not public yet.',
        fr: 'WaveDeck est une table de mixage audio virtuelle et modulaire pour Windows, la version de Julien de Voicemeeter. Elle est écrite en Python avec PySide6, utilise sounddevice pour l’audio et Pedalboard pour charger des plugins VST3. Le code n’est pas encore public.' },
      { w: 2, k: ['mush', 'linkinbio'],
        en: 'mush.rip is a link-in-bio platform: one page for a person’s links, social profiles and statistics. A small team builds it; Julien co-owns it and handles product and operations.',
        fr: 'mush.rip est une plateforme link-in-bio\u00a0: une page unique pour les liens, les réseaux et les statistiques d’une personne. Une petite équipe la développe\u202f; Julien en est copropriétaire et s’occupe du produit et des opérations.' },
      { w: 2, k: ['flocko', 'flockocord', 'flockopops', 'chat', 'websocket', 'messagerie'],
        en: 'Flockocord is a real-time chat application Julien wrote from scratch with Node.js, Express, WebSockets, SQLite and JWT. This assistant is named after it.',
        fr: 'Flockocord est une application de messagerie en temps réel écrite de zéro par Julien, avec Node.js, Express, WebSockets, SQLite et JWT. Cet assistant porte son nom.' },
      { w: 2, k: ['wingman', 'cs2', 'counter', 'csgo', 'game', 'jeu', 'jeux', 'gaming', 'bot', 'tournoi', 'tournament', 'matchmaking'],
        en: 'Wingman is a Counter-Strike 2 community with its own Discord bot (discord.js, SQLite): matchmaking, tournaments and anti-raid protection.',
        fr: 'Wingman est une communauté Counter-Strike 2 dotée de son propre bot Discord (discord.js, SQLite)\u00a0: matchmaking, tournois et protection anti-raid.' },
      { id: 'ai', w: 3, k: ['ia', 'ai', 'robot', 'assistant', 'automatique', 'automated', 'chatgpt', 'gpt', 'llm', 'humain', 'human'],
        en: 'I am an automated assistant: my answers are produced automatically from information about Julien and may be incomplete. For anything important, please email him directly.',
        fr: 'Je suis un assistant automatisé\u00a0: mes réponses sont produites automatiquement à partir d’informations sur Julien et peuvent être incomplètes. Pour toute demande importante, écrivez-lui directement.' },
      { w: 2, k: ['cv', 'resume'],
        en: 'Julien sends his CV on request: <a href="mailto:' + CONFIG.email + '?subject=CV%20request">' + CONFIG.email + '</a>.',
        fr: 'Julien transmet son CV sur demande\u00a0: <a href="mailto:' + CONFIG.email + '?subject=Demande%20de%20CV">' + CONFIG.email + '</a>.' },
      { k: ['contact', 'email', 'mail', 'reach', 'joindre', 'discord', 'atteindre', 'ecrire', 'hire', 'embauche', 'recrute', 'recruter', 'freelance', 'mission', 'stage', 'internship', 'job', 'dispo', 'disponible', 'available', 'availability'],
        en: 'You can reach Julien by email at ' + MAIL + ', on Discord (starbadge) or on GitHub (' + GH + '). He is open to internships, freelance work and collaborations.',
        fr: 'Vous pouvez joindre Julien par e-mail à ' + MAIL + ', sur Discord (starbadge) ou sur GitHub (' + GH + '). Il est ouvert aux stages, aux missions freelance et aux collaborations.' },
      { k: ['stack', 'tech', 'techno', 'technologie', 'language', 'langage', 'tool', 'outil', 'python', 'react', 'node', 'javascript', 'skill', 'competence'],
        en: 'Languages: Python, JavaScript and Bash, with C currently being learned at Epitech. Also PySide6 (Qt) for desktop, Node.js, Express and React for the web, SQLite, Git and Linux.',
        fr: 'Langages\u00a0: Python, JavaScript et Bash, ainsi que le C, en cours d’apprentissage à Epitech. Également PySide6 (Qt) pour le desktop, Node.js, Express et React pour le web, SQLite, Git et Linux.' },
      { k: ['epitech', 'school', 'ecole', 'study', 'studies', 'etude', 'student', 'etudiant', 'pge', 'bac', 'sti2d', 'formation', 'cursus', 'diplome', 'parcours'],
        en: 'Julien is in the first year of Epitech Paris’s Programme Grande École (PGE), where he is learning C and the Unix environment. Before that: a STI2D baccalauréat with the SIN specialisation (2026).',
        fr: 'Julien est en 1re année du Programme Grande École d’Epitech Paris (PGE), où il apprend le C et l’environnement Unix. Auparavant\u00a0: baccalauréat STI2D, spécialité SIN (2026).' },
      { k: ['paris', 'where', 'located', 'location', 'localisation', 'based', 'habite', 'ville', 'city', 'france'],
        en: 'Julien is based in Paris, France.', fr: 'Julien est basé à Paris.' },
      { k: ['car', 'cars', 'voiture', 'automobile', 'bmw', 'circuit'],
        en: 'Outside development, Julien is into cars, skateboarding and catamaran sailing.',
        fr: 'En dehors du développement, Julien s’intéresse à l’automobile, au skate et au catamaran.' },
      { k: ['skate', 'skateboard', 'planche'], en: 'Yes, Julien skateboards.', fr: 'Oui, Julien fait du skate.' },
      { k: ['catamaran', 'sail', 'sailing', 'voile', 'bateau', 'mer', 'sea'], en: 'Yes, Julien sails catamarans.', fr: 'Oui, Julien fait du catamaran.' },
      { k: ['hobby', 'hobbies', 'passion', 'loisir', 'spare', 'leisure', 'interet', 'sport'],
        en: 'Off screen: cars, skateboarding, catamaran sailing and Counter-Strike 2.',
        fr: 'Hors écran\u00a0: l’automobile, le skate, le catamaran et Counter-Strike 2.' },
      { k: ['project', 'projet', 'travaux', 'work', 'build', 'portfolio', 'realisation'],
        en: 'Main projects: WaveDeck (virtual audio mixer for Windows), mush.rip (link-in-bio platform he co-owns), Flockocord (real-time chat application) and Wingman (Counter-Strike 2 community and Discord bot).',
        fr: 'Projets principaux\u00a0: WaveDeck (table de mixage audio virtuelle pour Windows), mush.rip (plateforme link-in-bio dont il est copropriétaire), Flockocord (messagerie en temps réel) et Wingman (communauté Counter-Strike 2 et bot Discord).' },
      { k: ['who', 'qui', 'about', 'present', 'presente', 'yourself', 'julien', 'profil', 'profile', 'age'],
        en: 'Julien is a web and desktop developer based in Paris, in his first year at Epitech (Programme Grande École). He co-owns mush.rip and is building WaveDeck, a virtual audio mixer for Windows.',
        fr: 'Julien est développeur web et desktop, basé à Paris, en 1re année à Epitech (Programme Grande École). Il est copropriétaire de mush.rip et développe WaveDeck, une table de mixage audio virtuelle pour Windows.' },
      { k: ['merci', 'thanks', 'thx', 'thank', 'cool', 'nice', 'top', 'super', 'parfait'], en: 'You’re welcome.', fr: 'Avec plaisir.' },
      { g: 1, k: ['salut', 'bonjour', 'hello', 'hi', 'hey', 'yo', 'coucou', 'wesh', 'bonsoir', 'slt'],
        en: 'Hello. You can ask me about Julien’s projects, skills, studies or how to contact him.',
        fr: 'Bonjour. Vous pouvez m’interroger sur les projets, les compétences, la formation de Julien ou la façon de le contacter.' }
    ];
    var FB = {
      en: 'I don’t have that information. I can answer questions about Julien’s projects, skills, studies or contact details.',
      fr: 'Je n’ai pas cette information. Je peux répondre aux questions sur les projets, les compétences, la formation ou les coordonnées de Julien.'
    };
    var GREET = {
      en: 'Hello, I’m flockopops, the site’s automated assistant. What would you like to know about Julien?',
      fr: 'Bonjour, je suis flockopops, l’assistant automatisé du site. Que souhaitez-vous savoir sur Julien\u202f?'
    };
    var CHIPS = { en: ['Projects', 'WaveDeck', 'Skills', 'Contact'], fr: ['Projets', 'WaveDeck', 'Compétences', 'Contact'] };
    var BUSY = {
      en: 'Too many questions in a short time. Please wait a few seconds.',
      fr: 'Trop de questions en peu de temps. Merci de patienter quelques secondes.'
    };

    function norm(q) { return q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
    // Answer in the language of the question when it is clear, otherwise in the page language.
    var LW = {
      en: ['the', 'what', 'who', 'is', 'are', 'how', 'his', 'he', 'does', 'do', 'can', 'you', 'your', 'about', 'where', 'tell', 'me', 'and', 'with', 'which'],
      fr: ['le', 'la', 'les', 'est', 'quoi', 'qui', 'comment', 'ses', 'sa', 'son', 'il', 'tu', 'vous', 'votre', 'quel', 'quelle', 'quels', 'des', 'du', 'avec', 'parle', 'moi', 'et', 'sont', 'fait', 'peut']
    };
    function qLang(words) {
      var e = 0, f = 0;
      words.forEach(function (w) { if (LW.en.indexOf(w) !== -1) e++; if (LW.fr.indexOf(w) !== -1) f++; });
      return e > f ? 'en' : f > e ? 'fr' : lang;
    }
    // Word-level matching: short keys must match a whole word, longer keys may match a prefix (projet → projets).
    function scripted(q) {
      var words = norm(q).split(' '), best = null, bestScore = 0, greet = null, ql = qLang(words);
      // "are you a bot?" / "tu es un bot ?" is about the assistant, not about Wingman's bot
      if (words.indexOf('bot') !== -1 && /\b(you|are|tu|es|vous|etes)\b/.test(words.join(' '))) {
        best = KB.filter(function (e) { return e.id === 'ai'; })[0];
        return best[ql] || best.en;
      }
      KB.forEach(function (e) {
        var score = 0;
        e.k.forEach(function (k) {
          for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w === k || (k.length >= 4 && w.indexOf(k) === 0)) { score += (e.w || 1); break; }
          }
        });
        if (!score) return;
        if (e.g) { greet = e; return; }
        if (score > bestScore) { best = e; bestScore = score; }
      });
      var e = best || greet;
      return e ? (e[ql] || e.en) : (FB[ql] || FB.en);
    }

    var started = false, busy = false, hist = [], apiDown = !CONFIG.chatApi || location.protocol === 'file:';
    function push(who, fill) {
      var m = document.createElement('div');
      m.className = 'fc-msg ' + who; fill(m);
      msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight;
      return m;
    }
    function addHTML(who, html) { return push(who, function (m) { m.innerHTML = html; }); } // only for the static answers above
    function addText(who, txt) { return push(who, function (m) { m.textContent = txt; }); }
    var LINK = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]|[\w.+-]+@[\w-]+\.[\w.-]*\w)/g;
    function addLinked(who, txt) {
      return push(who, function (m) {
        var last = 0;
        txt.replace(LINK, function (hit, _g, at) {
          if (at > last) m.appendChild(document.createTextNode(txt.slice(last, at)));
          var a = document.createElement('a'), mail = hit.indexOf('@') > 0 && hit.indexOf('://') < 0;
          a.href = mail ? 'mailto:' + hit : hit; a.textContent = hit;
          if (!mail) { a.target = '_blank'; a.rel = 'noopener nofollow'; }
          m.appendChild(a); last = at + hit.length;
          return hit;
        });
        if (last < txt.length) m.appendChild(document.createTextNode(txt.slice(last)));
      });
    }
    function typing() {
      var m = push('bot fc-typing', function (el) { el.innerHTML = '<span></span><span></span><span></span>'; });
      m.setAttribute('aria-hidden', 'true');
      return m;
    }
    function apiReply(q) {
      if (apiDown) return Promise.resolve(null);
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
      return fetch(CONFIG.chatApi, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q.slice(0, 500), lang: lang, history: hist.slice(-6) }),
        signal: ctrl && ctrl.signal
      }).then(function (r) {
        clearTimeout(to);
        if (r.status === 404 || r.status === 405 || r.status === 501) { apiDown = true; return null; } // static hosting
        if (r.status === 429) return { rl: true };
        if (!r.ok) return null;
        return r.json().then(function (d) {
          return d && typeof d.reply === 'string' && d.reply.trim() ? d.reply.trim().slice(0, 1500) : null;
        });
      }, function () { clearTimeout(to); return null; });
    }
    function ask(q) {
      if (busy) return;
      busy = true; send.disabled = true;
      addText('me', q);
      var t = typing(), t0 = Date.now();
      function finish(res) {
        setTimeout(function () {
          t.remove();
          if (res && res.rl) addText('bot', BUSY[lang] || BUSY.en);
          else if (typeof res === 'string') { addLinked('bot', res); hist.push({ role: 'user', content: q }, { role: 'assistant', content: res }); }
          else {
            var html = scripted(q);
            addHTML('bot', html);
            hist.push({ role: 'user', content: q }, { role: 'assistant', content: html.replace(/<[^>]+>/g, '') });
          }
          if (hist.length > 12) hist = hist.slice(-12);
          busy = false; send.disabled = false;
        }, Math.max(0, 450 - (Date.now() - t0)));
      }
      apiReply(q).then(finish, function () { finish(null); });
    }
    function renderChips() {
      chips.innerHTML = '';
      (CHIPS[lang] || CHIPS.en).forEach(function (c) {
        var b = document.createElement('button');
        b.className = 'fc-chip'; b.type = 'button'; b.textContent = c;
        b.addEventListener('click', function () { ask(c); });
        chips.appendChild(b);
      });
    }
    function openPanel() {
      panel.hidden = false; fab.classList.add('hide'); fab.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; addText('bot', GREET[lang] || GREET.en); }
      renderChips();
      setTimeout(function () { text.focus(); }, 50);
    }
    function closePanel() {
      panel.hidden = true; fab.classList.remove('hide'); fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    }
    fab.hidden = false;
    // Appears once the introduction has scrolled out of view, to keep the first screen clean.
    var hero = document.querySelector('.hero');
    if (hasIO && hero) {
      new IntersectionObserver(function (es) { fab.classList.toggle('show', !es[0].isIntersecting); }).observe(hero);
    } else fab.classList.add('show');
    fab.addEventListener('click', openPanel);
    xbtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closePanel(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = text.value.trim();
      if (!v || busy) return;
      text.value = '';
      ask(v);
    });
    onLang(function () { if (!panel.hidden) renderChips(); });
  })();

  /* ===================== go ===================== */
  applyLang(lang);
  root.classList.remove('i18n-wait');
})();

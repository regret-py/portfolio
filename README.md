# regret.info

Personal site of Julien: web and desktop developer, first-year student at Epitech Paris.
Static HTML, CSS and JavaScript. No framework, no build step.

## Structure

```
index.html            page content (English) + all CSS, inlined for a fast first paint
404.html              not-found page (follows the saved theme and language)
assets/js/site.js     behaviour + French translation (one file, commented by section)
assets/fonts/         Jost Italic (variable, Latin subset), SIL OFL 1.1, see OFL.txt
assets/img/           photos (WebP + JPEG fallback), avatars, social preview (preview.png, 1200×630)
api/chat.js           optional Groq proxy for the assistant (Vercel only)
favicon.svg/.ico, apple-touch-icon.png, robots.txt, sitemap.xml, .well-known/security.txt
CNAME, .nojekyll      GitHub Pages (custom domain, serve dot-folders as is)
vercel.json           HTTP headers if the site is ever deployed on Vercel
```

## Editing content

- **English** is written directly in `index.html`. **French** lives in `assets/js/site.js`, in the `T.fr` object.
  Each translatable element carries a key: `data-i18n="key"` (text), `data-i18n-html` (text with links),
  `data-i18n-aria`, `-alt`, `-ph`, `-href` (attributes). Add the key in both places.
- French typography: `\u00a0` before `:` and `\u202f` before `;`, `?`, `!`. The French copy addresses
  the reader as *vous*.
- **Projects / skills / background** are plain lists in `index.html` (`.prow` and `.xp-row` blocks).
  Each project tile picks its colourway with a class: `t-red`, `t-ink` or `t-paper`; add `lnk` when the tile links out.
- **CV**: the links open an email. To host a PDF instead, add `cv.pdf` at the root and point the two
  `data-i18n="cv"` / `cta_cv` links to `/cv.pdf` (remove their `data-i18n-href`).
- **Images**: add the JPEG and a WebP next to it (`<picture>` serves WebP, JPEG is the fallback).
  For example with https://squoosh.app or `cwebp -q 80 photo.jpg -o photo.webp`.
- **Social preview**: `assets/img/preview.png` is what Discord, LinkedIn, etc. show. Regenerate it if
  the headline changes. `favicon.svg` is the white J from Jost on red; `favicon.ico` and `apple-touch-icon.png`
  are renders of it.
- Update `<lastmod>` in `sitemap.xml` after a significant change.

## Look and feel

Streetwear-shop inspired: white, black and one signal red, hard edges, no shadows, small uppercase labels.

- **Type**: the system Helvetica (Helvetica Neue, then Arial) for text; Jost Italic, a free Futura-style face,
  for the logo box and the display headings. Jost is the only web font, loaded once.
- **Red box**: `.box` (white italic on red) is the logo in the navigation and the footer. The highlighted
  phrase in the headline (`h1 em`) is the same box, following the line breaks.
- **Tokens** are at the top of the `<style>` in `index.html` (and `404.html`). Change `--mark` to re-colour the
  whole site; `--accent` is the variant used for red *text* (it is lighter in the dark theme to keep contrast).
- The contact block (red) and the footer (black) look the same in both themes.
- The strip under the introduction is decorative (`aria-hidden`) and stops with reduced motion.

## Features

- EN / FR (browser language by default, remembered; the French page is never shown in English first).
- Light / dark theme (follows the OS until the visitor picks one, remembered, no flash).
- WaveDeck mixer mock-up: faders, pan knobs, mute/solo, keyboard accessible.
- GitHub contributions graph (live, with a snapshot fallback), Discord status (Lanyard, status only),
  local time in Paris.
- Assistant "flockopops": scripted answers, or Groq through `api/chat.js` on Vercel. It always states
  that it is automated. Set `chat: false` in `CONFIG` (top of `site.js`) to remove it.
- Visit counter: one anonymous hit per session on regret.info, **never displayed**. Read the total at
  `https://abacus.jasoncameron.dev/get/julien-roullet-portfolio/views`.
- Print / "Save as PDF" gives a clean, CV-like document (navigation, mock-up and photos hidden).
- Accessibility: skip link, visible focus, WCAG AA contrast in both themes, reduced-motion support,
  proper headings and labels. Uppercase headings and labels are done with CSS only (the HTML keeps the original case);
  the e-mail address stays in lower case so it can be copied as is.
- SEO: canonical URL, Open Graph / Twitter cards, JSON-LD `Person`, sitemap.

## Hosting

### GitHub Pages (current)
Push to the repository; `CNAME` keeps the custom domain. GitHub Pages cannot send custom HTTP headers,
so the **Content-Security-Policy is set with a `<meta>` tag** in `index.html` and `404.html`.
`api/chat.js` and `vercel.json` are ignored there, and the assistant uses its scripted answers.

### Vercel (optional, enables the Groq assistant)
1. Import the repository on vercel.com and deploy.
2. Project → Settings → Environment Variables:
   - `GROQ_API_KEY` (required), from https://console.groq.com
   - `ALLOWED_ORIGIN` = `https://regret.info` (exact match; comma-separated for several)
   - `GROQ_MODEL` (optional, default `llama-3.3-70b-versatile`)
3. In `assets/js/site.js`, set `chatApi: '/api/chat'` in `CONFIG`, then redeploy.

## Content-Security-Policy and the inline scripts

Each page has one small inline script (theme and language before first paint), allowed by its
SHA-256 hash in the CSP. **If you edit one of these scripts, its hash must be updated**, otherwise the
browser blocks it (the site still works thanks to the fallback in `site.js`, but the theme may flash).

Get the new hash, then paste it in the page's CSP `<meta>` (and in `vercel.json` if you use Vercel):

```sh
python3 -c "import re,hashlib,base64,sys;[print(\"'sha256-\"+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode()+\"'\") for m in re.findall(r'<script>(.*?)</script>',open(sys.argv[1],encoding='utf-8').read(),re.S)]" index.html
```

Chrome's console also prints the expected hash when a script is blocked.

## Security, honestly

- No secret in the front end. The Groq key (if used) stays in a Vercel environment variable.
- XSS: strict CSP (no `unsafe-inline` for scripts, no third-party scripts), assistant replies rendered
  as text, never as HTML.
- No third-party requests on load except the three read-only APIs listed in the CSP `connect-src`.
  Fonts are self-hosted (no Google Fonts call).
- Clickjacking protection (`frame-ancestors`) only works as an HTTP header, so only on Vercel.
- The front-end code is public by design; only secrets can be protected, and there are none here.
- For DDoS or bot protection, put the domain behind Cloudflare (free plan).

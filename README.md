# Julien — portfolio

Static site + one serverless function for the flockopops chat (Groq).

## Files
- `index.html` — the site (styles and scripts inlined, no build step)
- `assets/img/` — photos, avatar and the social preview image (`preview.png`, 1200×630)
- `404.html` — custom not-found page (follows the saved theme and language)
- `api/chat.js` — serverless proxy that talks to Groq (keeps the API key secret)
- `vercel.json` — security headers (CSP, HSTS, anti-clickjacking, etc.) + asset caching
- `favicon.svg`, `robots.txt`, `sitemap.xml` — icon and SEO basics

## Features
- EN / FR switch (auto-detects the browser language, remembered across visits)
- Dark / light theme (follows the OS until the visitor picks one, remembered, no flash on load)
- Live GitHub contributions graph, live Discord presence (Lanyard), view counter
- flockopops chat: Groq when `/api/chat` is available, scripted answers otherwise
- Accessible: skip link, visible keyboard focus, WCAG AA text contrast, reduced-motion support
- SEO: canonical URL, Open Graph / Twitter cards, JSON-LD `Person`, sitemap

## Editing tips
- **Images**: drop files in `assets/img/` and reference them by path. They're cached for 30 days on Vercel,
  so give a replaced image a new file name if it must update immediately.
- **CV**: the "Ask for my CV" link opens an email. To host the PDF instead, add `cv.pdf` at the root and
  point that link (Experience section) to `/cv.pdf`.
- **Domain**: `regret.info` is hard-coded in the `<head>` meta tags, `robots.txt` and `sitemap.xml`.

## Deploy on Vercel (free)
1. Push these files to a GitHub repo (keep the `api/` folder at the root).
2. Import the repo on vercel.com → Deploy.
3. In **Project → Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your free key from https://console.groq.com  (**required**)
   - `ALLOWED_ORIGIN` = your final URL(s), e.g. `https://regret.info` (comma-separated for several). Exact match.
     If unset, the endpoint only accepts calls coming from its own host.
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (optional; `llama-3.1-8b-instant` is faster/lighter)
4. Redeploy. The chat now uses Groq; if the key is missing or the API fails, it automatically falls back to the built-in scripted answers.

> **GitHub Pages** (the `CNAME` file) serves the static site only: `api/chat.js` and the headers in
> `vercel.json` are ignored there, and the chat automatically uses its scripted answers.

## Security notes (what's protected, honestly)
- **API key**: lives only in the Vercel env var, never in the browser. Safe.
- **Injection / XSS**: strict `Content-Security-Policy` + all chat replies rendered as text (escaped), never as HTML.
- **Clickjacking**: `X-Frame-Options: DENY` + `frame-ancestors 'none'`.
- **Abuse / quota burn**: input capped at 500 chars (history at 6 messages), `max_tokens` capped, per-IP rate limit (15/min), exact origin lock, JSON-only, 10s timeout.
- **HTTPS enforced**: HSTS.
- **Front-end code is public by design** — browsers must download HTML/CSS/JS to render it, so it can't be "hidden". Only *secrets* can be protected (and they are, server-side). Minifying only makes copying less convenient.
- **Real DDoS / WAF / bot protection** isn't something a static site can do alone. For that, put the domain behind **Cloudflare (free)**: proxy the DNS, turn on "Under Attack" mode when needed, and add a rate-limiting rule. That's the strongest free layer.

## Harden the rate limit further (optional)
The in-memory limiter resets on cold starts. For a strict per-IP limit, create a free **Upstash Redis** DB and store hit counts there instead of the in-memory `Map`.

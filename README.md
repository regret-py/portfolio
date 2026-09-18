# Julien — portfolio

Static site + one serverless function for the flockopops chat (Groq).

## Files
- `index.html` — the site (self-contained: images, styles, scripts inlined)
- `404.html` — custom not-found page
- `api/chat.js` — serverless proxy that talks to Groq (keeps the API key secret)
- `vercel.json` — security headers (CSP, HSTS, anti-clickjacking, etc.)

## Deploy on Vercel (free)
1. Push these files to a GitHub repo (keep the `api/` folder at the root).
2. Import the repo on vercel.com → Deploy.
3. In **Project → Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your free key from https://console.groq.com  (**required**)
   - `ALLOWED_ORIGIN` = your final URL, e.g. `https://ren.vercel.app`  (recommended — locks the chat endpoint to your site)
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (optional; `llama-3.1-8b-instant` is faster/lighter)
4. Redeploy. The chat now uses Groq; if the key is missing or the API fails, it automatically falls back to the built-in scripted answers.

## Security notes (what's protected, honestly)
- **API key**: lives only in the Vercel env var, never in the browser. Safe.
- **Injection / XSS**: strict `Content-Security-Policy` + all chat replies rendered as text (escaped), never as HTML.
- **Clickjacking**: `X-Frame-Options: DENY` + `frame-ancestors 'none'`.
- **Abuse / quota burn**: input capped at 500 chars, `max_tokens` capped, per-IP rate limit (15/min), origin lock, 10s timeout.
- **HTTPS enforced**: HSTS.
- **Front-end code is public by design** — browsers must download HTML/CSS/JS to render it, so it can't be "hidden". Only *secrets* can be protected (and they are, server-side). Minifying only makes copying less convenient.
- **Real DDoS / WAF / bot protection** isn't something a static site can do alone. For that, put the domain behind **Cloudflare (free)**: proxy the DNS, turn on "Under Attack" mode when needed, and add a rate-limiting rule. That's the strongest free layer.

## Harden the rate limit further (optional)
The in-memory limiter resets on cold starts. For a strict per-IP limit, create a free **Upstash Redis** DB and store hit counts there instead of the in-memory `Map`.

# neko-fin 🐾 — file-based blog for Netlify Drop

Personal opinions on financial markets + misc notes. **Educational only — not financial advice.**

- Author: Shrin
- GitHub: https://github.com/thisisforlearn
- 100% static HTML/CSS/JS. No build, no database. Free-plan friendly.
- Dark default + light toggle. SEO + optimized caching.

## 1) Deploy in 30 seconds (Netlify Drop)

**Option A — drag folder:**
1. Go to https://app.netlify.com/drop
2. Drag **this whole folder** (with `index.html` at root) → you get a live URL instantly.

**Option B — drag ZIP:**
1. Zip the contents (see `neko-fin-drop.zip` if provided, or zip yourself: select all files → compress)
2. Drop the `.zip` on the same page.

**Option C — update existing site:**
Site → Deploys tab → drag new folder/zip there (updates same URL).

> Free plan note: static only = unlimited-ish, no functions used, tiny files (<100KB total). Perfect for free.

## 2) How posts work (files only)

Posts live in `/posts/*.md` + listed in `posts.json`:

```json
[
  { "id": "my-slug", "file": "posts/my-slug.md" }
]
```

Post format (`posts/example.md`):

```md
---
title: "My title"
date: 2026-10-03
category: Market
tags: nifty, beginner
excerpt: "1-2 line summary"
references: NSE | https://www.nseindia.com; Title2 | https://...
---

## My opinion
Write markdown here...
```

- `category` must be `Market` or `Misc` (anything else → Misc).
- `references` = `Title | https://…` separated by `;` → shows in “Links & references” box.
- Plain `.txt` also works via the in-browser importer.

## 3) Write without code (browser editor)

1. Open site → **Write ✎** (top right)
2. Login: user `nekofin`, password `123456789@neko.me.to@yolo-hi-meow`
3. Write → **Save to browser** (instant on your device) → **Export .md**
4. To publish for *everyone*: put that `.md` in `/posts`, add line to `posts.json`, re-drop folder on Netlify.
5. **Change login:** editor → *Change login* → enter old password + new user/pass.

> ⚠️ Security truth: this is a **static site** — there is no server. The password is checked in your browser (SHA-256) only to stop accidental edits. Anyone who can view page source can bypass it. Don't treat it as real security. Never reuse that password anywhere else. For real private editing, use Netlify Identity / password-protected deploy or keep drafts local.

## 4) Disclaimers (already in site)

- Top risk bar + footer + `#/disclaimer` page: **not financial advice, not buy/sell/hold, consult licensed professional, risk of loss.**
- **AI disclosure:** code + some drafts AI-assisted, human-reviewed. Shown in footer, About, post header, and Disclaimer §5.

## 5) Files

```
index.html  styles.css  app.js
posts.json  posts/*.md
netlify.toml  _headers  _redirects
robots.txt  sitemap.xml  favicon.svg  404.html
```

Optimized: no CDN, system fonts, lazy images, semantic HTML, JSON-LD, OG tags, long-cache CSS/JS, security headers.

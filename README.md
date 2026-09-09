# Claire.dev — Personal Bilingual Blog

**English** | [中文](./README.zh-CN.md)

A bilingual (English/Chinese) static blog built with [Astro 5](https://astro.build): white background, blue accents, typing animation, zero client-side framework. Deployed on Netlify with Decap CMS for online publishing.

**Live site**: https://clairelyt.netlify.app
(If you rename the Netlify site, also update `site` in `astro.config.mjs` and the Sitemap line in `public/robots.txt`.)

## Features

- **Fully static** — fast, secure, free to host, no client-side framework
- **Bilingual** — English at the root, Chinese under `/zh`; posts live in `src/content/blog/en/` and `zh/`, files with the same name are automatically linked as translations, with a language switcher in the nav
- **Online writing (CMS)** — visit `/admin` for Decap CMS: create/edit posts in both languages and manage contact info visually; saving commits straight to `main` and auto-deploys
- **Content validation** — frontmatter is validated by a Zod schema (`title`, `description`, `pubDate` required; `tags` optional); malformed posts fail the build
- **SEO ready** — sitemap, RSS feeds (`/rss.xml`, `/zh/rss.xml`), Open Graph, canonical and hreflang tags
- **Syntax highlighting** — Shiki (github-light theme), built into Astro
- **Self-hosted fonts** — no Google Fonts CDN, loads fine in mainland China
- **Responsive design** — respects reduced-motion preference; no tracking, no comments, no ads

## Usage

Requires Node.js 22 (same as CI and Netlify).

```bash
npm install        # install dependencies
npm run dev        # local dev server, http://localhost:4321
npm run build      # build to dist/
npm run preview    # preview the build locally
npm run check      # astro check type checking
```

### Publishing a new post (no code changes)

**Option 1: CMS (recommended)**
Visit `/admin` on the live site, pick Blog (English) or 博客（中文）, fill in slug, title, description, date and body, then publish. Use the **same slug** for both languages to link them as translations.

**Option 2: Plain Markdown**
Create `my-new-post.md` in `src/content/blog/en/` (English) or `zh/` (Chinese). The filename becomes the URL (`/blog/my-new-post` or `/zh/blog/my-new-post`):

```markdown
---
title: "My New Post"
description: "A one-line summary shown in the post list."
pubDate: 2026-09-08
tags: ["java", "opensource"]
---

Your article content in Markdown goes here...
```

Then commit and push (locally via `git push`, or on the GitHub web UI via *Add file* → *Create new file*). Netlify detects the push and rebuilds automatically (~1 minute).

### Updating contact info (no code changes)

Edit it under Site Settings in the CMS, or edit `src/data/contacts.json` directly — each entry has a `label` (name), `value` (link text) and `url` (destination):

```json
{
  "label": "GitHub",
  "value": "ClaireLytt",
  "url": "https://github.com/ClaireLytt"
}
```

Both the English and Chinese About pages update automatically.

### Project structure

```
src/
├── content/blog/{en,zh}/    # posts (same filename = translations)
├── content.config.ts        # content collection schema
├── layouts/BaseLayout.astro # site-wide layout (nav, language switcher, SEO tags)
├── pages/                   # routes (en at root, zh under /zh)
└── data/contacts.json       # contact info (editable in the CMS)
public/admin/                # Decap CMS config
.github/workflows/ci.yml     # CI
```

## CI

Every PR to `main` and every push to `main` (including CMS publishing commits) triggers [GitHub Actions](.github/workflows/ci.yml):

| Check | What it does | Blocking |
|---|---|---|
| `astro check` | Type-checks .astro/.ts files (strict mode) | ✅ Blocking |
| `astro build` | Builds the site; validates all post frontmatter | ✅ Blocking |
| Internal links | lychee scans `dist/` offline for broken internal links and asset references | ✅ Blocking |
| en/zh pairing | Warns about posts that exist in only one language | ⚠️ Warning only |
| External links | Checks that outbound links in posts are reachable (separate job; network flakiness never blocks a merge) | ⚠️ Non-blocking |

Notes:

- **PRs are a gate**: failing checks mean don't merge. **Pushes to `main` are an alarm**: if a CMS-published post breaks something, GitHub Actions shows a red X after the fact
- Pairing and external-link results appear as warning annotations in the Actions run summary

## Deployment (one-time setup)

1. Push this repo to GitHub (public is fine — only you have push access)
2. Sign in to [Netlify](https://app.netlify.com) with your GitHub account
3. *Add new site* → *Import an existing project* → pick this repo
4. Build settings are auto-detected from `netlify.toml` (Node 22, `npm run build` → publish `dist/`). Click *Deploy*
5. Your site is live at `https://<random-name>.netlify.app` — rename it under *Site settings → Site details → Change site name*

After that, every push to `main` builds and deploys automatically.

## License

Source code is [MIT licensed](./LICENSE). Blog article content (`src/content/blog/`) is **all rights reserved** — please don't republish articles without permission.

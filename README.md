# Personal Tech Blog

A minimal, fast personal blog built with [Astro](https://astro.build). White background,
blue accents, typing animation, zero client-side framework.

**Live site**: `https://<your-site>.netlify.app`

## Features

- Static site — fast, secure, free to host
- Bilingual (English default, Chinese at `/zh`) with a language switcher in the nav
- Write posts in plain Markdown, no code changes needed to publish
- Syntax highlighting for code blocks (Shiki, built into Astro)
- Responsive design, no tracking, no comments, no ads

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output to dist/
```

## How to publish a new post (no code changes)

1. Create a new file in `src/content/blog/en/` (English) or `src/content/blog/zh/`
   (Chinese), e.g. `my-new-post.md`. The filename becomes the URL:
   `/blog/my-new-post` or `/zh/blog/my-new-post`.
   If the same filename exists in both folders, the language switcher on the post
   page links the two versions together automatically.

2. Start the file with this frontmatter:

   ```markdown
   ---
   title: "My New Post"
   description: "A one-line summary shown in the post list."
   pubDate: 2026-09-08
   tags: ["java", "opensource"]
   ---

   Your article content in Markdown goes here...
   ```

3. Publish it, either way:
   - **Locally**: `git add . && git commit -m "post: my new post" && git push`
   - **On GitHub web**: go to `src/content/blog/` in the repo → *Add file* →
     *Create new file* → paste content → *Commit changes*

4. Netlify detects the push and rebuilds automatically (~1 minute). Done.

## How to update contact info (no code changes)

Edit `src/data/contacts.json` — each entry has a `label` (shown as the name),
a `value` (shown as the link text), and a `url` (where the link goes):

```json
{
  "label": "GitHub",
  "value": "ClaireLytt",
  "url": "https://github.com/ClaireLytt"
}
```

Add, remove, or edit entries, then commit/push (locally or on the GitHub web UI)
— both the English and Chinese About pages update automatically.

## Deployment (one-time setup)

1. Push this repo to GitHub (public is fine — only you have push access).
2. Sign in to [Netlify](https://app.netlify.com) with your GitHub account.
3. *Add new site* → *Import an existing project* → pick this repo.
4. Build settings are auto-detected from `netlify.toml`. Click *Deploy*.
5. Your site is live at `https://<random-name>.netlify.app` — rename it under
   *Site settings → Site details → Change site name*.

## License

Source code is [MIT licensed](./LICENSE). Blog article content
(`src/content/blog/`) is **all rights reserved** — please don't republish
articles without permission.

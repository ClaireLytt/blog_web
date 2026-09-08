# Personal Tech Blog

A minimal, fast personal blog built with [Astro](https://astro.build). White background,
blue accents, typing animation, zero client-side framework.

**Live site**: `https://<your-site>.netlify.app`

## Features

- Static site — fast, secure, free to host
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

1. Create a new file in `src/content/blog/`, e.g. `my-new-post.md`.
   The filename becomes the URL: `/blog/my-new-post`.

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

import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.netlify.app',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});

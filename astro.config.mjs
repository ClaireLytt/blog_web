import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: must match your real Netlify site name, otherwise canonical URLs,
// sitemap and RSS links point to the wrong domain.
export default defineConfig({
  site: 'https://clairelyt.netlify.app',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});

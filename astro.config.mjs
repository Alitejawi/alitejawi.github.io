import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Old theme addresses that only redirect; they do not belong in the sitemap.
const redirected = ['/tags/', '/categories/', '/archives/'];

export default defineConfig({
  site: 'https://itejawi.com',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !redirected.some((path) => new URL(page).pathname === path) }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  redirects: {
    '/tags/': '/writing/',
    '/categories/': '/writing/',
    '/archives/': '/writing/',
  },
});

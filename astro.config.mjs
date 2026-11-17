import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Old theme addresses that only redirect; they do not belong in the sitemap.
const redirected = ['/tags/', '/categories/', '/archives/'];

// Drafts and scheduled notes are shown by `astro dev` and by nothing else. The flag comes
// from the command that is running, because import.meta.env.DEV also turns on for a build
// started with NODE_ENV=test, which would publish them.
const unpublishedInDev = {
  name: 'unpublished-in-dev',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      updateConfig({
        vite: { define: { 'import.meta.env.SHOW_UNPUBLISHED': JSON.stringify(command === 'dev') } },
      });
    },
  },
};

export default defineConfig({
  site: 'https://itejawi.com',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    // The whole stylesheet is about 17 kB; inline it so the first paint needs no extra request.
    inlineStylesheets: 'always',
  },
  // Fetch a page when its link is hovered or focused, so the click feels instant.
  // Astro skips this for visitors on a data-saving or slow connection.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    unpublishedInDev,
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

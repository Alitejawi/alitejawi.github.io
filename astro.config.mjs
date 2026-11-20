import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Old theme addresses that only redirect; they do not belong in the sitemap.
const redirected = ['/tags/', '/categories/', '/archives/', '/now/'];

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

// The font files ship in the @fontsource packages; Astro serves them from the site itself
// and writes the preload links. The fallbacks are ours: 'Geist Sans Fallback' is defined in
// src/styles/global.css. Astro's own generated fallback has no character range, so it would
// also take over characters the Latin subset lacks, such as the arrows in the receipts.
const family = (name, pkg, weights, fallbacks) => ({
  provider: fontProviders.local(),
  name,
  cssVariable: `--font-${pkg}`,
  fallbacks,
  optimizedFallbacks: false,
  options: {
    variants: weights.map((weight) => ({
      weight,
      style: 'normal',
      src: [`@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`],
    })),
  },
});

export default defineConfig({
  site: 'https://itejawi.com',
  fonts: [
    family('Geist Sans', 'geist-sans', [400, 500, 600], ['Geist Sans Fallback', 'system-ui', 'sans-serif']),
    family('Geist Mono', 'geist-mono', [400, 500], ['ui-monospace', 'monospace']),
  ],
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
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
    // Now and About became one page on 20 November 2026.
    '/now/': '/about/#now',
  },
});

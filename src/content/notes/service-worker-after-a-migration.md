---
title: "My browser kept showing a site I had deleted: service workers after a migration"
date: 2026-11-24 09:00:00 +0100
description: "I moved this site from Jekyll to Astro. Five days later a browser of mine still showed the old homepage, with no styles. The new site was fine and every check was green. What kept the old page alive, the fourteen-line fix, and the test that now replays the move."
slug: service-worker-after-a-migration
topic: Web
draft: true
---

## What I saw

On 12 November 2026 I replaced this site. The old one was Jekyll with the Chirpy theme. The new one is Astro.

Five days later I opened itejawi.com in Dia and hit refresh. I got the old homepage: the old navigation, the old headline, blue links on a white page and no styles at all.

## The site was fine

From a terminal, `curl` returned the new homepage. Lighthouse scored it 100 in all four categories. The test suite, which drives a fresh browser through every page, was green.

So nothing was wrong with what I had published. The problem lived in browsers that had been here before, and none of my checks used one. I pasted the screenshot into a Claude Code session and asked what was going on.

## What kept the old page alive

The answer was in the old site's config, still in the git history:

```yaml
pwa:
  enabled: true
  cache:
    enabled: true
```

With that on, the theme registers a service worker at `/sw.min.js`. A service worker is a script the browser keeps and runs in front of every request to the site. This one saves the homepage when it installs and saves other pages as you visit them. Its fetch handler, simplified:

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
```

If a page is in the cache, the cache answers and the network is never asked. That's what an offline cache is for, and it did its job. The browser had the old homepage saved, so it kept serving it. The old stylesheet no longer exists on the server, so the page came up bare.

## Why deleting the file made it stick

A browser checks the worker's address for a new version when you visit. If the file has changed, the new worker replaces the old one. That's how a cached site normally picks up a redesign.

The Astro site has no service worker, so `/sw.min.js` returned a 404. A failed update check doesn't remove a worker. The browser keeps the one it has. By deleting the file I had removed the only way to tell those browsers to stop.

I can't say how many people saw the broken page in those five days. The site had no analytics.

## The fix

The fix is a new worker at the same address, and its only job is to leave:

```js
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: 'window' });
      await Promise.all(tabs.map((tab) => tab.navigate(tab.url).catch(() => null)));
    })(),
  );
});
```

A returning browser finds this on its next update check and swaps it in. The worker deletes the caches, unregisters itself and reloads the open tabs, which now come from the network.

## The test

I couldn't reach into anyone's browser, and I didn't want to ship this on faith. So the fix came with a browser test that replays the move:

1. A local server serves a copy of the old site, with the theme's real worker.
2. The browser visits. The worker installs and takes control of the page.
3. The server switches to the new build, at the same address.
4. The browser visits again.

Without the fix, the test waited 15 seconds and the page was still the old one. With it, the browser landed on the new site in under four seconds, with no worker registered and no caches left.

The test stays in the suite. It's the only one that starts with a browser that has history.

## What I took from it

Removing a service worker is a deploy of its own. Replace the file. Don't delete it.

Every check I had started from a clean browser, and this bug only exists in a used one. It's the same gap as testing a fresh install and never an upgrade.

I only found it because I opened my own site in a browser that had been there before.

<!--
Before publishing (Ali):
1. Did Dia show the new site after the fix went live on 17 November? If yes, add one sentence saying so at the end of "The fix".
2. Check the wording of "What I saw" against what you remember.
3. Set the date, then remove `draft: true` and this comment.
-->

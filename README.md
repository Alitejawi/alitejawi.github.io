# itejawi.com

The source of [itejawi.com](https://itejawi.com): field notes on security, systems and IT automation, and the projects I build.

It is a static site built with [Astro](https://astro.build) and published on GitHub Pages.

## Run it

```sh
npm install
npm run dev        # local site, with drafts and scheduled notes
npm test           # build, then check the built pages
npm run test:e2e   # browser tests: layout, accessibility, privacy
```

Node 26 is required.

## How it is published

Every push to `main` runs the type check, the build tests and the browser tests, and deploys only if they pass. The same checks run on pull requests. A second workflow keeps the espresso count on the homepage up to date.

A field note is one Markdown file in `src/content/notes/`. Its `date` decides the day it goes live, so a note can be merged ahead of time.

[AGENTS.md](AGENTS.md) has the rules and conventions for working on the site.

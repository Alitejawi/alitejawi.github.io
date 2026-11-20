# Working on this site

This is the source of [itejawi.com](https://itejawi.com), Ali Al-Itejawi's personal site. It is a static Astro site on GitHub Pages. **A push to `main` publishes it**, so work on a branch and open a pull request.

## Rules

1. **Never name an employer.** No current or former employer, client, tenant, host or colleague, anywhere: pages, alt text, metadata, tests, commit messages.
2. **Everything is true and checkable.** Do not invent, estimate or round up a number. A number that was measured on a date keeps its date.
3. **The two project repos are private.** Do not link their code.
4. **Nothing reaches `main` without Ali's go-ahead for that change.**
5. **The homepage layout stays as it is** unless Ali asks for a change.
6. **Post dates stay hidden** (`site.showDates` is `false`).
7. **No third-party requests.** Fonts are self-hosted; a browser test fails if a page contacts another site. The one planned exception is the visitor counter in `src/lib/analytics.ts`, which is off.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local site with live reload. Shows drafts and scheduled notes. |
| `npm run check` | Type check. |
| `npm test` | Builds the site into `dist/` as it will be once every scheduled note is live, and checks the output. |
| `npm run test:e2e` | Browser tests against `dist/`. Run `npm test` first, so scheduled notes are covered. |
| `npm run build` | Production build. |

Write the test first and watch it fail. GitHub runs all of the above before every deploy and on every pull request (`.github/actions/build-and-test`).

## Writing a field note

A note is one Markdown file in `src/content/notes/`. Its front matter has exactly these keys; an unknown key fails the build.

```yaml
---
title: "The title, printed as the page's only <h1>"
description: "One or two sentences. Printed under the title, so do not repeat them in the body."
date: 2026-11-24 09:00:00 +0100   # goes live on this calendar day, Spanish time
slug: the-url-part                # /posts/the-url-part/
topic: AI agents                  # the chip next to the note number
draft: true                       # optional: never built, except by npm run dev
numbered: false                   # optional: no "No. NN", not on the homepage receipt
feed: false                       # optional: left out of the RSS feed, the one place a note's date shows
---
```

- **Scheduling.** A note with a future `date` can be merged at any time. It appears on the morning of that day, when the deploy workflow runs (07:02 UTC), or with any deploy after midnight in Spain.
- **Format.** No `# Title` line. Sections are `##` headings; the page numbers them and builds the contents list, so do not number them or write a contents list by hand.
- **Tests.** The tests read the list of notes from the folder, scheduled ones included, so a scheduled note is checked when it is merged and not on the morning it is due. Drafts get the format checks only. A new note needs no test edits. Add a test only for facts that are specific to the note, as `tests/build.test.ts` does for the delete-lock note.
- **Quotes.** Straight quotes in prose are published as curly quotes. A test that looks for text with an apostrophe has to allow for that.
- **Link preview.** The build draws the share image for each note and project (`src/lib/og-card.ts`). Nothing to make by hand.
- **Drafts from another machine** arrive with company details already removed. Do not add any back, and check facts by asking Ali, not by guessing.

## Where things are

| Path | What |
| --- | --- |
| `src/data/site.ts` | Name, headline, links, ticker text, feature switches. |
| `src/data/bio.ts` | The first-person text shared by the About page and the README note. |
| `src/data/espresso.json` | The espresso count and the last UTC day it counted (`through`). The Daily Espressos workflow commits to it; do not edit by hand. |
| `src/lib/notes.ts` | Note numbering and the rule for what is published. |
| `src/layouts/Base.astro`, `Article.astro` | Page shell and the article page. |
| `astro.config.mjs` (`fonts`), `src/styles/global.css` | The fonts, and the fallback face that keeps text from re-wrapping while they load. |
| `public/sw.min.js` | Removes the old site's offline cache from returning browsers. Keep it. |
| `src/scripts/decode.ts` | The ASCII decode (ascii-reveal): the README note on every open, the espresso count on the first homepage view of a visit, the not-found page with its glyph field. Off with reduced motion; articles never load it. |
| `tests/build.test.ts` | Checks on the built pages. |
| `tests/e2e/` | Browser tests: layout, accessibility, privacy, the README note, the ticker, the decode. |

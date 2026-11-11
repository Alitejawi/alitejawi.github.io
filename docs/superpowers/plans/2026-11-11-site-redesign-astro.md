# itejawi.com Astro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll/Chirpy site with a custom Astro site in the approved contentarchitecture.dev style, with two FDE-focused case studies, and the same post URLs.

**Architecture:** Static Astro site at the repo root, built to `dist/` and deployed to GitHub Pages by Actions. Content lives in Astro content collections: `notes` (Markdown field notes) and `projects` (MDX case studies). The site-wide facts live in `src/data/site.ts`, and the espresso count lives in `src/data/espresso.json`, which a small Node script bumps daily. Shared visual pieces (nav + ticker, receipt, chip, figure, code block) are Astro components styled from one token file.

**Tech Stack:** Node 26, Astro 7.x, @astrojs/mdx 8.x, @astrojs/rss 4.x, @fontsource/geist-sans + @fontsource/geist-mono 5.x, Vitest 5.x + cheerio (unit and built-HTML tests), @playwright/test 1.6x (phone-width and reduced-motion checks).

**Spec:** `docs/superpowers/specs/2026-11-11-site-redesign-design.md`, with case-study copy in `docs/superpowers/specs/2026-11-11-case-studies-draft.md`. Read both before starting.

## Global Constraints

- Work on branch `redesign-astro`. Never push to or merge into `main` in this plan; Task 10 (cutover) is done only with Ali present.
- **No employer names** anywhere that ships: no "Work" section, no company logos, no `worksFor`/`alumniOf` in JSON-LD, no company names in meta tags.
- **No post dates shown.** Keep `date` in front matter; rendering is gated by `site.showDates` (default `false`).
- **Never invent numbers.** Case-study copy comes verbatim from the case-studies draft. `[FILL IN]` markers stay visible as placeholders.
- **Do not link project code** (repos are private). Link demo videos only (placeholders until Ali supplies URLs).
- Tokens: paper `#f1eee7`, ink `#232323`, dark grey `#5b5a56`, mid grey `#cbcbcb`, ghost grey `#dedede`, dashed line `#9a978f`, accent `#ff9100`.
- Fonts: Geist (body/UI), Geist Mono (labels, uppercase, `letter-spacing: .02em`). Self-hosted via Fontsource; no Google Fonts requests.
- Light theme only. Every animation is disabled under `prefers-reduced-motion: reduce`.
- Site URL `https://itejawi.com`; `trailingSlash: 'always'`; `build.format: 'directory'`.
- Exact legacy URLs that must exist in `dist/`: `/posts/Add_gmail_delegate_silently/`, `/posts/three-gam-commands-every-monday/`, `/posts/Welcome/`, `/about/`, `/feed.xml`. Redirect pages: `/tags/`, `/categories/`, `/archives/` → `/writing/`.
- Keep favicon and OG image paths unchanged: `/assets/img/favicons/*`, `/assets/img/og.png`. `public/CNAME` contains exactly `itejawi.com`.
- Phones: no horizontal scroll at 375px wide on any page.
- Nav items, in order: Writing, Projects, Now, About.

## Review Focus

1. **Long unbreakable text on a 375px phone** (long code lines such as `gam user user@yourdomain.com delegate to delegate@yourdomain.com`, long inline code like `users.settings.delegates.create`): the page must not scroll sideways; code blocks scroll inside themselves. Test owned by Task 3 (`no horizontal overflow at 375px` across all pages).
2. **Case-sensitive URLs on GitHub Pages:** `/posts/Add_gmail_delegate_silently/` must be emitted with that exact casing, not lowercased by a slug helper. Test owned by Task 2 (`legacy URLs exist with exact casing`).
3. **Espresso bump on a malformed or missing data file:** the bump script must fail loudly (non-zero exit) and never write a reset count like `2`. Test owned by Task 5 (`bumpEspresso rejects invalid file`).
4. **Reduced motion:** the ticker must stop and fade-ins must render content immediately. Test owned by Task 3 (`reduced motion stops ticker and shows content`).
5. **A note with no `##` headings** (the Welcome post): the post page must not render an empty Contents receipt. Test owned by Task 4 (`no contents receipt when a note has no h2`).

---

### Task 1: Astro scaffold replacing Jekyll, tokens, fonts, base layout, deploy workflow

**Files:**
- Delete: `_config.yml`, `Gemfile`, `index.html`, `.nojekyll`, `.gitmodules`, `assets/lib` (submodule), `_data/`, `_includes/`, `_layouts/`, `_plugins/`, `_sass/`, `_tabs/archives.md`, `_tabs/categories.md`, `_tabs/tags.md`, `assets/css/`, `assets/fonts/`, `tools/`, `.devcontainer/`. Keep `_posts/` and `_tabs/about.md` until Tasks 2 and 8 move their content.
- Move: `CNAME` → `public/CNAME`; `assets/img/` → `public/assets/img/`.
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/data/site.ts`, `src/pages/index.astro` (temporary placeholder), `tests/build.test.ts`, `tests/helpers/dist.ts`
- Modify: `.github/workflows/pages-deploy.yml`, `.gitignore` (add `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`), `README.md` (replace Chirpy text with 5 lines: `npm install`, `npm run dev`, `npm test`, `npm run build`, deploy note)

**Interfaces:**
- Produces: `site` object exported from `src/data/site.ts`:
  ```ts
  export const site: {
    name: 'Ali Al-Itejawi'; role: 'Principal Systems Engineer'; url: 'https://itejawi.com';
    email: 'ali@itejawi.com'; location: 'Amsterdam'; timeZone: 'Europe/Amsterdam';
    links: { github: 'https://github.com/alitejawi'; linkedin: 'https://www.linkedin.com/in/alitejawi/' };
    showDates: false;
    stack: { name: string; role: string }[];   // Okta·Identity, Google Workspace·GAM, Jamf Pro·Endpoint, Python·Pipelines, Ollama·Local LLMs
    ticker: string[];                           // e.g. 'Currently building AI pipelines that run every day'
  };
  ```
- Produces: `Base.astro` props `{ title: string; description: string; ogImage?: string }`, renders `<head>` (fonts, tokens, canonical, OG/Twitter tags, RSS link, JSON-LD `Person` with `name`, `url`, `jobTitle`, `sameAs` only), a `<slot name="nav" />`, and `<main><slot /></main>`.
- Produces: `tests/helpers/dist.ts` → `readDist(path: string): string` (reads `dist/<path>`, throws if missing) and `loadDist(path: string): CheerioAPI`.
- Produces: npm scripts `dev`, `build`, `preview`, `test` (`vitest run`), `test:e2e` (`playwright test`).

- [ ] **Step 1:** Delete and move the files listed above (`git rm -r`, `git mv`). Install Astro and dev deps at the versions in Tech Stack.
- [ ] **Step 2: Write the failing build test** in `tests/build.test.ts`, run after `npm run build` (vitest `globalSetup` runs `astro build` once):
  - `CNAME is itejawi.com`: `readDist('CNAME').trim() === 'itejawi.com'`
  - `favicons and og image keep their paths`: `dist/assets/img/favicons/favicon.ico` and `dist/assets/img/og.png` exist
  - `JSON-LD Person has no employer`: parse `script[type="application/ld+json"]` on `index.html`; `@type === 'Person'`, no `worksFor`, no `alumniOf`
  - `no Google Fonts requests`: `index.html` contains no `fonts.googleapis.com`
- [ ] **Step 3:** Run `npm test`. Expected: FAIL (no dist / missing files).
- [ ] **Step 4:** Implement `astro.config.mjs` (site, trailingSlash, build.format, mdx integration), tokens/global CSS (tokens from Global Constraints; body paper/ink; Geist 400/500/600 and Geist Mono 400/500 imported from Fontsource), `site.ts`, `Base.astro`, placeholder `index.astro`.
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6:** Rewrite `pages-deploy.yml` build job: `actions/checkout@v4`, `actions/setup-node@v4` (node 26, npm cache), `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact@v3` with `path: dist`. Keep the `deploy` job and triggers (push to `main`, `workflow_dispatch`) unchanged. Remove the htmlproofer step.
- [ ] **Step 7: Commit** `git commit -m "feat: replace Jekyll with Astro scaffold, tokens, base layout"`

### Task 2: Notes collection, numbering, legacy URLs, writing index, feed, redirects

**Files:**
- Create: `src/content.config.ts`, `src/lib/notes.ts`, `src/content/notes/` (moved posts), `src/pages/posts/[slug].astro` (minimal body render; styled in Task 4), `src/pages/writing/index.astro`, `src/pages/feed.xml.ts`, `tests/notes.test.ts`
- Move: `_posts/2025-02-06-Welcome.md` → `src/content/notes/welcome.md`; `_posts/2025-02-07-Add_gmail_delegate_silently.md` → `src/content/notes/add-gmail-delegate-silently.md`; `_posts/2026-05-11-three-gam-commands-every-monday.md` → `src/content/notes/three-gam-commands-every-monday.md`. Delete `_posts/`.
- Modify: `astro.config.mjs` (add `redirects: { '/tags/': '/writing/', '/categories/': '/writing/', '/archives/': '/writing/' }`), `tests/build.test.ts`

**Interfaces:**
- Consumes: `site.showDates` (Task 1).
- Produces: `notes` collection schema: `{ title: string; description: string; date: Date; slug: string; numbered: boolean (default true); topic: string; commands?: { label: string; value: string }[] }`.
- Produces: `projects` collection schema, defined here so Task 6 can query it before Task 7 adds entries: `{ title: string; oneLiner: string; receiptValue: string; order: number; video?: string; image?: string }`, loader globbing `src/content/projects/*.mdx` (folder exists, empty, with a `.gitkeep`). Front matter per file: `slug` = exact legacy slug (`Welcome`, `Add_gmail_delegate_silently`, `three-gam-commands-every-monday`); `numbered: false` on Welcome; `topic: 'Google Workspace'` on both GAM posts. Drop `categories`/`tags`.
- Produces in `src/lib/notes.ts`:
  - `readMinutes(body: string): number` — words / 220, rounded up, minimum 1.
  - `formatNo(n: number): string` — `formatNo(1) === 'No. 01'`, `formatNo(12) === 'No. 12'`.
  - `numberNotes<T extends { data: { date: Date; numbered: boolean } }>(notes: T[]): (T & { no: number | null })[]` — numbered notes get 1..n by ascending date; unnumbered get `null`. Returned newest first.
  - `getNotes(): Promise<NumberedNote[]>` — loads the collection and applies `numberNotes`.
- Content edits in the two GAM notes (needed by the numbered-section design): delete the body `# ...` H1 line (the page title comes from front matter), and in `three-gam-commands-every-monday.md` strip the manual `1. ` / `2. ` / `3. ` prefixes from `##` headings.

- [ ] **Step 1: Write failing unit tests** (`tests/notes.test.ts`): `readMinutes('word '.repeat(440)) === 2`, `readMinutes('') === 1`; `formatNo` cases above; `numberNotes` on three fixtures (Welcome 2025-02-06 numbered:false, delegate 2025-02-07, monday 2026-05-11) → order `[monday(no 2), delegate(no 1), welcome(no null)]`.
- [ ] **Step 2: Add failing build tests:** `legacy URLs exist with exact casing` (each of `posts/Add_gmail_delegate_silently/index.html`, `posts/three-gam-commands-every-monday/index.html`, `posts/Welcome/index.html` exists, and `posts/add_gmail_delegate_silently/index.html` does not); `feed.xml lists the notes` (contains both GAM titles); `old taxonomy pages redirect` (`tags/index.html` contains `/writing/` in a meta refresh); `writing index has no dates` (`writing/index.html` contains `No. 01` and `No. 02`, and none of `2025`, `2026`, `Feb`, `May`).
- [ ] **Step 3:** Run `npm test`. Expected: FAIL.
- [ ] **Step 4:** Implement the collection, `notes.ts`, file moves and content edits, `[slug].astro` via `getStaticPaths` using `data.slug`, `writing/index.astro` (numbered list: mono `No. NN`, title, description, `N min`; Welcome listed last without a number), `feed.xml.ts` (@astrojs/rss, items link to `/posts/<slug>/`), redirects.
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat: notes collection with legacy URLs, writing index, feed, redirects"`

### Task 3: Shared components and browser checks

**Files:**
- Create: `src/components/Nav.astro`, `src/components/Ticker.astro`, `src/components/Receipt.astro`, `src/components/ReceiptLine.astro`, `src/components/Chip.astro`, `src/components/Figure.astro`, `src/components/FadeIn.astro`, `src/scripts/clock.ts`, `playwright.config.ts`, `tests/e2e/layout.spec.ts`
- Modify: `src/layouts/Base.astro` (render `Nav` in the nav slot)

**Interfaces:**
- Consumes: `site.ticker`, `site.timeZone` (Task 1).
- Produces:
  - `Nav` props `{ current?: 'writing' | 'projects' | 'now' | 'about'; newDot?: 'writing' | 'projects' | 'now' | 'about' }`. Dark ink bar, dotted texture, striped logo mark linking `/`, uppercase mono links, orange dot on `newDot`, `Ticker` below. Fits at 375px (links may shrink/wrap; no overflow).
  - `Ticker` props `{ items: string[] }`. Duplicated track for a seamless loop; one item renders the live Amsterdam time via `clock.ts` (`formatClock(date: Date, timeZone: string): string` → `HH:MM`). Under reduced motion: `animation: none`, items laid out statically.
  - `Receipt` props `{ title: string; aside?: string; footer?: string }` with a default slot of groups; `ReceiptLine` props `{ label: string; value?: string; href?: string; current?: boolean }` (dotted leader between label and value; `current` uses accent). Real text, dashed borders in `#9a978f`.
  - `Chip` props `{ text: string }`.
  - `Figure` props `{ no: number; caption: string }`, default slot; caption renders `Fig. 0N · {caption}` in mono uppercase.
  - `FadeIn` wraps a slot; IntersectionObserver adds `.in`; no-JS and reduced motion show content immediately.

- [ ] **Step 1: Write failing tests:** unit `formatClock(new Date('2026-11-11T20:14:00Z'), 'Europe/Amsterdam') === '21:14'` in `tests/clock.test.ts`. Playwright (`webServer: npm run preview`, built first): `no horizontal overflow at 375px` loops over `/`, `/writing/`, `/posts/Add_gmail_delegate_silently/`, `/posts/three-gam-commands-every-monday/`, `/projects/`, `/projects/brain/`, `/projects/daily-diff/`, `/about/`, `/now/` and asserts `document.documentElement.scrollWidth <= window.innerWidth` (pages not built yet are skipped with `test.skip` when the response is 404; remove skips as pages land); `reduced motion stops ticker and shows content` with `reducedMotion: 'reduce'`: ticker track's computed `animation-name` is `none`, and every `[data-fade]` element has computed `opacity` `1`.
- [ ] **Step 2:** Run `npm test && npm run build && npm run test:e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement the components to the mockup look (spec "Signature components").
- [ ] **Step 4:** Run the same commands. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: nav, ticker, receipt, chip, figure, fade-in components"`

### Task 4: Post page

**Files:**
- Create: `src/layouts/Article.astro`, `src/components/ContentsReceipt.astro`, `src/components/CodeBlock.ts` (client script)
- Modify: `src/pages/posts/[slug].astro`, `astro.config.mjs` (Shiki theme), `tests/build.test.ts`

**Interfaces:**
- Consumes: `getNotes`, `formatNo`, `readMinutes` (Task 2); `Nav`, `Receipt`, `ReceiptLine`, `Chip` (Task 3).
- Produces: `Article` props `{ kicker: string; chip?: string; minutes: number; title: string; lede: string; headings: { depth: number; slug: string; text: string }[]; extraReceipt?: { title: string; lines: { label: string; value: string }[] }; prev?: { href: string; label: string; title: string }; next?: { href: string; label: string; title: string } }`. Used again by case studies (Task 7).
- `ContentsReceipt` renders only when there is at least one depth-2 heading; lines are `01 <text>` … linking `#slug`; an IntersectionObserver marks the current section `current`. Desktop: sticky right column (~260px). Under 900px wide: a collapsed `<details>` above the body.
- Body: max ~640px, 17–18px/1.7; `h2` numbered 01, 02… with CSS counters in mono grey; inline code ghost-grey; links underlined in accent.
- Code blocks: Shiki dark theme with background forced to ink + dotted texture; `CodeBlock.ts` adds a mono label bar (`Shell` for `sh`/`bash`, else language name) and a Copy button using `navigator.clipboard`; `pre` scrolls horizontally inside itself.
- Kicker: `Field note ${formatNo(no)}` + topic chip + `${minutes} min read`; unnumbered notes show `Field note`. Lede = `data.description`. No date anywhere when `site.showDates` is false. Prev/next follow numbered order; Welcome gets only a link back to `/writing/`.
- "Commands used" receipt group: optional front matter `commands: { label: string; value: string }[]`. Add to the delegation note: `delegate to` · Add, `show delegates` · Verify, `delete delegate` · Remove.

- [ ] **Step 1: Write failing build tests:** `post shows kicker, chip and read time` (`posts/Add_gmail_delegate_silently/index.html` contains `Field note No. 01`, `Google Workspace`, `min read`); `post shows no date` (that page contains neither `2025` nor `Feb`); `contents receipt lists sections` (contains `Default delegation` inside the contents element); `no contents receipt when a note has no h2` (`posts/Welcome/index.html` has no contents element); `commands receipt` (delegation page contains `show delegates`).
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `Article`, `ContentsReceipt`, `CodeBlock.ts`, wire `[slug].astro`.
- [ ] **Step 4:** Run `npm test && npm run build && npm run test:e2e`. Expected: PASS (post pages now in the overflow check).
- [ ] **Step 5: Commit** `git commit -m "feat: field note page with contents receipt and code blocks"`

### Task 5: Espresso data file, bump script, workflow

**Files:**
- Create: `src/data/espresso.json`, `scripts/bump-espresso.mjs`, `tests/espresso.test.ts`
- Modify: `.github/workflows/daily-espressos.yml`

**Interfaces:**
- Produces: `src/data/espresso.json` = `{ "count": <current value from main's _tabs/about.md> }` (read it with `git show main:_tabs/about.md`; it will be refreshed again at cutover).
- Produces in `scripts/bump-espresso.mjs`: exported `bumpEspresso(path: string, by = 2): { from: number; to: number }`. Reads JSON, requires `count` to be a non-negative integer, writes `{ "count": to }` with a trailing newline. Throws on missing file, invalid JSON, or invalid `count`, leaving the file untouched. CLI: `node scripts/bump-espresso.mjs` bumps `src/data/espresso.json` and prints `from -> to`; exits non-zero on error.
- Produces: `formatCount(n: number): string` in the same module → `formatCount(13209) === '13,209'` (en-US grouping), used by pages.

- [ ] **Step 1: Write failing tests:** `bumpEspresso adds 2` (temp file `{count: 13209}` → returns `{from: 13209, to: 13211}`, file now 13211); `bumpEspresso rejects invalid file` (missing file, `{}`, `{"count": "13,209"}`, and `not json` each throw, and the existing file contents are unchanged); `formatCount(13209) === '13,209'`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the script and data file.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Update `daily-espressos.yml`: replace the Python step with `actions/setup-node@v4` (node 26) and `node scripts/bump-espresso.mjs`; `git add src/data/espresso.json`; keep commit message `Daily espressos +2`, author `Ali Al-Itejawi <ali@itejawi.com>`, push, and the `gh workflow run pages-deploy.yml --ref main` step. (This file only takes effect after cutover merges it to `main`.)
- [ ] **Step 6: Commit** `git commit -m "feat: espresso count as data file with tested bump script"`

### Task 6: Homepage

**Files:**
- Modify: `src/pages/index.astro`, `tests/build.test.ts`

**Interfaces:**
- Consumes: `site`, `getNotes`, `formatNo`, `readMinutes`, `formatCount`, espresso JSON, `getCollection('projects')` (Task 7 provides entries; until then render the Projects receipt group and Selected work from an empty list without errors), all Task 3 components.
- Layout (desktop two columns, stacked under 900px with the receipt below the hero):
  - Left: mono `Ali Al-Itejawi · Principal Systems Engineer`; headline `<h1>` from `site.headline`; grey lede from `site.lede`; big number `formatCount(count)` with mono label `Espressos consumed` and `Chip` `+2 every day`.
  - Headline/lede copy: add `headline` and `lede` to `site.ts`. Use the current line as the default (`I make corporate infrastructure quiet.` / `Secure, automated, invisible. Okta, Google Workspace, Jamf, and the AI systems I build on top.`) and write 2–3 alternatives that say "problem solver" and connect systems work to AI systems in production, into `docs/superpowers/specs/headline-options.md` for Ali to choose from. Do not block on his choice.
  - Right: `Receipt` title `Field notes & work`, aside `itejawi.com`. Groups: **Projects** (each project's `title` → `receiptValue`, linking its page), **Field notes** (numbered notes only: `formatNo` + title → `N min`), **Stack** (`site.stack` name → role), footer `Thank you for reading`.
  - Below: **Selected work** tiles (image or placeholder, title, one line) → **Field notes** list → closing line with GitHub, LinkedIn, email links. Wrap sections in `FadeIn`.
  - `Nav` with no `current`, `newDot: 'projects'`.

- [ ] **Step 1: Write failing build tests:** `homepage shows espresso count` (`index.html` contains `formatCount` of the JSON value and `+2 every day`); `homepage receipt lists numbered notes only` (contains `No. 01`, `No. 02`, not `Welcome` inside the receipt); `homepage has no dates and no Work section` (no `2025`/`2026` in the receipt, no heading with text `Work`).
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: homepage hero, receipt, selected work"`

### Task 7: Projects index and case studies

**Files:**
- Create: `src/content/projects/brain.mdx`, `src/content/projects/daily-diff.mdx`, `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`, `src/components/HitRateFigure.astro`, `src/components/DailyDiffReceipt.astro`, `src/components/FillIn.astro`
- Modify: `tests/build.test.ts`; delete `src/content/projects/.gitkeep`

**Interfaces:**
- Consumes: `Article` (Task 4), `Figure`, `Receipt`, `ReceiptLine`, `Chip` (Task 3), `projects` collection schema (Task 2).
- Entries: Brain: `receiptValue: '68% hit@5'`, `order: 1`. Daily Diff: `receiptValue: '07:34 daily'`, `order: 2`. Slugs from filenames: `/projects/brain/`, `/projects/daily-diff/`.
- Copy: verbatim from the case-studies draft, sections as `##` so they get numbered and appear in the contents receipt. Kicker `Project`, lede = `oneLiner`.
- `FillIn` props `{ text: string }` renders a visible dashed accent placeholder `[FILL IN: …]`. Use it for both demo video links, the printer photo, and the Daily Diff "why I built it" sentence. Video placeholders say "Demo video coming soon". The Daily Diff video caption, once present, reads `Demo with sample data`.
- `HitRateFigure`: two before/after bar pairs (hit@5 42%→68%, hit@1 22%→40%) drawn in HTML/CSS or inline SVG, inside `Figure no={1} caption="Hybrid search on 50 frozen queries"`.
- `DailyDiffReceipt`: a recreated brief in receipt style using only the real run stats from the draft (briefs 21, candidates median 193, picks median 18, podcast 18/18, email ~07:34). Inside `Figure no={1} caption="One morning's brief, as a receipt"` next to the photo placeholder.
- Projects index: two tiles (image or placeholder, title, one-liner) linking each case study. No code links anywhere.

- [ ] **Step 1: Write failing build tests:** `case studies exist` (`projects/brain/index.html`, `projects/daily-diff/index.html`); `brain shows real eval numbers` (contains `42%`, `68%`, `22%`, `40%`, `1,476`); `daily diff uses real numbers` (contains `193` and `18`, and does not contain `214` or `5 picks`); `no code links` (no `href` containing `github.com/Alitejawi/n8n` or `github.com/Alitejawi/brain` on any page under `projects/`); `fill-in markers are visible` (daily-diff page contains `FILL IN`).
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run build && npm run test:e2e`. Expected: PASS (remove the overflow-test skips for project pages).
- [ ] **Step 5: Commit** `git commit -m "feat: projects index and Brain / Daily Diff case studies"`

### Task 8: About and Now pages

**Files:**
- Create: `src/pages/about.astro`, `src/pages/now.astro`
- Delete: `_tabs/about.md` (and the empty `_tabs/`)
- Modify: `tests/build.test.ts`

**Interfaces:**
- Consumes: `site`, `formatCount` + espresso JSON, `Receipt`, `ReceiptLine`, `Chip`, `Nav`.
- About: short paragraphs (who Ali is, problems he likes, how he works with people) written from the spec, with no employers; a receipt of personal facts: Espressos consumed → live count, Countries visited → 29, Music → Lo-fi, Synthwave; one contact line (`mailto:ali@itejawi.com`). Drop "Books read".
- Now: title "Now", one paragraph rendered through `FillIn` (`Ali writes this before launch: current focus, what I'm building, what I'm reading`).

- [ ] **Step 1: Write failing build tests:** `about shows live espresso count` (`about/index.html` contains `formatCount` of the JSON value and `29`); `about has no books placeholder` (no `TBA`); `now page exists` (`now/index.html` contains `FILL IN`).
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement; delete `_tabs/`.
- [ ] **Step 4:** Run `npm test && npm run build && npm run test:e2e`. Expected: PASS (all overflow-test skips removed).
- [ ] **Step 5: Commit** `git commit -m "feat: about and now pages"`

### Task 9: Final local review with Ali

- [ ] **Step 1:** Run `npm test && npm run build && npm run test:e2e`. Expected: all PASS.
- [ ] **Step 2:** Run `npm run preview` and give Ali the local URL. Walk through every page on desktop and at phone width.
- [ ] **Step 3:** Collect Ali's changes (headline choice from `headline-options.md`, Now text, video URLs, photo, any visual tweaks). Apply them as small commits, re-running Step 1 after each.

### Task 10: Cutover (only with Ali's explicit go-ahead)

- [ ] **Step 1:** `git fetch origin && git merge origin/main` into `redesign-astro`. Resolve the daily conflict on `_tabs/about.md` by keeping it deleted, and set `src/data/espresso.json` `count` to the number in `origin/main:_tabs/about.md`.
- [ ] **Step 2:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 3:** Ask Ali to confirm, then open a PR `redesign-astro` → `main` and merge it (or merge locally and push, whichever Ali prefers). Avoid 13:00 UTC, when the espresso bot runs.
- [ ] **Step 4:** Watch the `Build and Deploy` run until it succeeds. Then check live: `https://itejawi.com/`, `/posts/Add_gmail_delegate_silently/`, `/posts/three-gam-commands-every-monday/`, `/posts/Welcome/`, `/about/`, `/feed.xml` all return 200, and `/tags/` redirects to `/writing/`.
- [ ] **Step 5:** Run the `Daily Espressos` workflow once via `gh workflow run daily-espressos.yml` and confirm it commits a +2 to `src/data/espresso.json` and the deploy shows the new number.

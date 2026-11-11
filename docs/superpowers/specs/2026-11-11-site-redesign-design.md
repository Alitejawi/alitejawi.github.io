# itejawi.com redesign: design

Date: 2026-11-11
Status: draft, awaiting Ali's approval

## Intent and the why

itejawi.com is Ali Al-Itejawi's personal site: a place people can find him and read what he writes. It now has a second, sharper job: help Ali land a **Forward Deployed Engineer (FDE)** role.

The test for every page: within 30 seconds a hiring manager should believe Ali is **a real problem solver** and **fun to work with**.

- "Problem solver" is carried by projects with real, checkable results (Brain's eval numbers, tests, months in production) and by practical field notes.
- "Fun" is carried by personality details: the live espresso counter, the receipt printer, the playful receipt motif.

The current site is the Chirpy Jekyll theme plus a custom homepage. It reads as a template. Ali wants it minimal, clean and distinctive.

## Goals

1. Replace the Chirpy theme entirely with a custom, minimal design (look below).
2. Lead with two project case studies (Brain, The Daily Diff) aimed at an FDE reader.
3. Keep field notes (posts) as a first-class, beautiful reading experience.
4. Keep every existing post URL working.
5. Keep the daily espresso counter working and visible.

## Non-goals

- No comments, newsletter, or analytics at launch (can be added later).
- No CMS. Content stays as Markdown/files in the repo.
- No blog taxonomy pages (tags, categories, archives).

## Anti-goals (failure even if it works)

- **Naming any employer**, past or current, anywhere on the site, including logos, "Work" sections, structured data, or meta tags. Describe experience by domain only (fintech, Web3, Okta / Google Workspace / Jamf).
- Looking like a template or a generic shadcn/Magic UI clone.
- CV-style filler: skill bars, percentage charts, invented metrics ("improved X by Y%" without evidence), "Work with me" sales buttons.
- Heavy effects that hurt reading or performance (3D scenes, scanlines, animated blur, all-bold text).
- Showing post dates (hidden for now; Ali may bring them back later, so keep dates in front matter and make showing them a one-line switch).

## Visual direction (approved in mockups)

Primary reference: contentarchitecture.dev. Secondary: emilkowal.ski (restraint, single narrow column), Magic UI portfolio (calm sections, subtle fade-in), makingsoftware.com (posts read like chapters of a technical manual, numbered figures).

Tokens (taken from contentarchitecture.dev's CSS):

| Token | Value | Use |
|---|---|---|
| paper | `#f1eee7` | page background |
| ink | `#232323` | text, dark surfaces |
| dark grey | `#5b5a56` | secondary text |
| mid grey | `#cbcbcb` | rules |
| ghost grey | `#dedede` | chips, inline code |
| dashed line | `#9a978f` | receipt borders, dotted leaders |
| accent | `#ff9100` | used sparingly: dots, link underlines, current item |

Type: **Geist** (UI and body) and **Geist Mono** (labels, uppercase, slight tracking). Self-host the fonts.

Signature components:

- **Floating nav**: dark (`ink`) rounded bar, centred near the top, subtle dotted texture, small striped logo mark, uppercase mono links (Writing, Projects, Now, About). An orange dot can flag something new. Beneath the links, a **ticker** strip scrolling short status items (latest field note, Amsterdam local time, what Ali is working on). Ticker stops under `prefers-reduced-motion`.
- **Receipt**: dashed-border box with a header row, grouped lines with dotted leaders and right-aligned values, and a closing line. Used on the homepage (field notes, stack) and as the sticky table of contents on posts and case studies.
- **Code blocks**: dark `ink` background with the same dotted texture, mono, a label bar ("Shell") and a copy button.
- **Figures**: dashed-border frame, simple boxes-and-arrows diagrams, mono caption "Fig. 01 · ...".
- **Chip**: small ghost-grey rounded label (e.g. "+2 every day", "Google Workspace").

Mockups the builder should match in spirit: `.superpowers/brainstorm/42793-1794428927/content/homepage-v3.html` (homepage) and `post-page.html` (post). These are local and git-ignored; copy them somewhere the builder can read, or treat this document as the source of truth.

## Pages

### Home `/`

Two-column hero on desktop:

- **Left**: mono label "Ali Al-Itejawi · Principal Systems Engineer"; a large headline; a one-sentence grey lede; a very large number with a mono label and chip.
- **Right**: a receipt.

Headline and lede: must say "problem solver" and connect Ali's systems/IT background to building AI systems that run in production, without naming employers. The current line ("I make corporate infrastructure quiet. Secure, automated, invisible.") is the starting point. **Final copy is Ali's call; the builder drafts 2-3 options for him.**

Big number: the **live espresso count** (from the daily bot) with chip "+2 every day". This is the "fun" signal.

Receipt (homepage): groups for **Projects** (Brain, The Daily Diff, each with a one-line value on the right such as "68% hit@5" / "07:30 daily"), **Field notes** (numbered, no dates, read time on the right), and **Stack** (Okta · Identity, Google Workspace · GAM, Jamf Pro · Endpoint, Python · Ollama, etc.; no proficiency levels), closing line e.g. "Thank you for reading".

Below the hero: **Selected work** (two project tiles with image, title, one line), then **Field notes** list, then a short closing line with links (GitHub, LinkedIn, email). Subtle fade-in on scroll in the Magic UI spirit, disabled under reduced motion.

### Field notes index `/writing/`

Numbered list (No. 02, No. 01 ...) of posts: title, one-line description, read time. No dates.

### Post `/posts/<slug>/`

As in `post-page.html`:

- Kicker: "Field note No. NN" + topic chip + read time.
- Title (large Geist), grey lede (from front-matter `description`).
- Body ~17-18px, max ~640px wide, h2 sections numbered "01, 02..." in mono.
- Sticky receipt on the right with Contents (current section highlighted in accent) and, where useful, a "Commands used" group.
- Footer: previous/next field note.
- On narrow screens the receipt moves above the body as a collapsed contents block.

Field-note numbers are assigned by publish order, oldest = 01, counting only real field notes. The "Welcome" post is not numbered, so the GAM delegation post is No. 01 and "Three GAM commands" is No. 02 (matches the mockups).

### Projects `/projects/` and case studies `/projects/<slug>/`

Index: the two projects as tiles. Each case study uses the post layout, structured the way an FDE thinks: **Problem → What I built → How I measured it → What I changed after launch → What's next**.

**Brain: a personal AI knowledge pipeline.** "Save a link once. AI reads it, summarises it, and finds it again for you."

- Ingests articles, YouTube, Instagram, X; transcribes on the Mac (Whisper), reads slide text (Apple Vision).
- Local LLMs (Ollama) write summaries and tags; `/ask` answers questions with sources.
- Measured on a frozen set of 50 real queries: hit@5 42% → 68%, hit@1 22% → 40%, from hybrid BM25 + vector search. This is the headline result; show it as a figure.
- Guardrails: no AI summary when source text is too short; daily check alerts Ali's phone if a save goes missing.
- Migrated off n8n to a tested Python package with no data loss. 1,476 tests, 545 commits, running daily since April 2026.

**The Daily Diff: an AI morning brief, on paper too.** "At 07:30 each day, about 190 candidates become about 18 picks, by email, podcast and receipt printer."

- Ranks saves, GitHub trending, YouTube and Anthropic news; learns from 👍/👎 votes in Ali's Reader app.
- Designed email, NotebookLM podcast link, and a printed copy on an 80 mm thermal printer over Wi-Fi.
- Raw ESC/POS printer commands written by hand, including 1-bit weather icons drawn in code.
- The site's receipt motif should explicitly echo this project: a recreated Daily Diff receipt on the page, and a photo of a real printout if Ali supplies one.

Ali supplies screenshots/photos. Until then, use tasteful placeholders that are obviously placeholders.

**Case-study copy** is drafted in `docs/superpowers/specs/2026-11-11-case-studies-draft.md` from facts Ali supplied (including Daily Diff run results 19 Oct - 11 Nov 2026 and real "what's next" items). Use that copy; keep its [FILL IN] markers visible as placeholders until Ali fills them. Never invent numbers.

**Links:** both project repos are private. Do **not** link code. Each case study links to a demo video instead (URLs from Ali, [FILL IN] until then).

### About `/about/`

Short and human. Who Ali is, the kind of problems he likes, how he works with people. Personality facts from the current About page: espresso counter (live), countries visited (29), music (lo-fi, synthwave). Drop "Books read: TBA" unless Ali fills it. No employers. One clear contact line (email).

The daily espresso workflow must keep updating the number shown here and on the homepage.

### Now `/now/`

A short "what I'm doing now" page (current focus, what I'm building, what I'm reading). Ali writes the content; the builder ships the page with a placeholder that Ali replaces before launch.

## Content and URLs

- Existing posts keep their exact, case-sensitive URLs (verified live on 2026-11-11; the lowercase variants 404):
  - `/posts/Add_gmail_delegate_silently/`
  - `/posts/three-gam-commands-every-monday/`
  - `/posts/Welcome/`
- `/about/` keeps its URL. Old Chirpy pages (`/tags/`, `/categories/`, `/archives/`) redirect to `/writing/`.
- Keep an Atom/RSS feed at its current path (`/feed.xml`).
- The "Welcome" post is weak; keep it reachable at its URL but leave it out of the homepage receipt. (Builder's call whether it shows in the index.)
- Keep the existing OG image and social preview behaviour; update the image to the new look if cheap.

## Constraints

- Domain `itejawi.com`, hosted on GitHub Pages from `Alitejawi/alitejawi.github.io`, deployed by GitHub Actions on push to `main`.
- **Espresso bot** (`.github/workflows/daily-espressos.yml`) runs daily, edits `_tabs/about.md` with the regex `(\*\*Espressos Consumed\*\* ☕: )([\d,]+)`, commits, and triggers the deploy workflow. After the migration, the number must live in one data file (e.g. `src/data/espresso.json` or similar) that both the homepage and About read, and the workflow must be updated to bump that file instead. It must keep committing as Ali (current behaviour).
- No employer names in any file that ships (including JSON-LD `Person` data: no `worksFor`).
- Works well on phones: hero stacks (receipt below headline), nav fits at 375px, no horizontal scroll.
- Accessible: real contrast on paper (check `#5b5a56` on `#f1eee7`), visible focus states, reduced-motion respected, receipt content is real text, not an image.
- Build happens on a separate branch; the live site does not change until Ali has seen the new one running and approved it.
- **Preview before cutover is local only** (the dev server / a local production preview). GitHub Pages serves one site per repo and the espresso bot redeploys `main` daily, so no preview host is set up.
- **Cutover**: in the same merge, (1) carry the latest espresso count from `main`'s `_tabs/about.md` into the new data file, (2) switch the bot to bump the new file, (3) replace the deploy workflow. Pause or skip the bot's run around the merge if needed so it doesn't commit to the old file mid-cutover.

## Decided by Ali

- Visual direction as above (contentarchitecture.dev style), approved in mockups.
- Post page layout as in `post-page.html`, approved.
- No employer names anywhere.
- Post dates hidden for now.
- Projects: Brain and The Daily Diff, framed for an FDE audience.
- Site purpose: personal, and aimed at landing an FDE role.
- **Rebuild on Astro** (replacing Jekyll), deployed to GitHub Pages via Actions.
- Project repos stay private and unlinked; link demo videos instead.

## Claude's calls (Ali to check)

- Field notes numbered without the Welcome post; preview is local only; cutover carries the espresso count over in the same merge.
- Espresso count as the homepage big number (fun), Brain's eval result as the headline figure on its case study and as a value in the homepage receipt (problem solver).
- Light theme only at launch (the reference design is light-only). The current site's dark mode is dropped.
- No analytics or comments at launch.
- Field-note numbering by publish order.
- Nav items: Writing, Projects, Now, About.

## Left to the builder

- Component structure, CSS approach (plain CSS or Tailwind), and file layout.
- Exact spacing, type scale, and responsive breakpoints, within the look above.
- How the ticker and fade-in are implemented, as long as they're light and respect reduced motion.
- Figure drawing approach (HTML/CSS or inline SVG).
- Image optimisation and font loading strategy.

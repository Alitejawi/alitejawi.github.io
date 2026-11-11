# Case studies: draft copy

Date: 2026-11-11
Status: draft for Ali to review. Every fact below comes from Ali. Anything missing is marked **[FILL IN]**. No numbers have been invented.

Rules for this copy: no employer names; do not link the code (both repos are private); link the demo videos instead.

---

## Brain: a personal AI knowledge pipeline

**Save a link once. AI reads it, summarises it, and finds it again for you.**

Demo video: [FILL IN: video URL]

### 01 Problem

I save a lot: articles, research papers, case studies, talks and videos. Saving was easy. Finding the right thing again weeks later was not. Bookmarks pile up, titles don't say what's inside, and half the useful content is spoken in a video or written on a slide, where search can't reach it.

### 02 What I built

A pipeline that reads everything I save, so I don't have to remember where I saw it.

- **Takes in** articles, research papers, case studies, videos and posts.
- **Reads what search can't:** speech is transcribed on the Mac with Whisper, and text on slides is read with Apple Vision.
- **Local models** (Ollama) write a summary and tags for every save.
- **`/ask`** answers a question across everything I've saved, and cites the sources it used.

### 03 How I measured it

Search quality is measured against a frozen set of 50 real queries, so every change is compared on the same questions.

| Metric | Before | After |
|---|---|---|
| hit@5 (right answer in the top 5) | 42% | 68% |
| hit@1 (right answer first) | 22% | 40% |

The jump came from hybrid search: combining keyword search (BM25) with vector search.

*Figure idea: a simple before/after bar pair for hit@5 and hit@1, captioned "Fig. 01 · Hybrid search on 50 frozen queries".*

### 04 Guardrails

- **No summary from too little text.** If a source is too short to summarise honestly, Brain skips the AI summary instead of guessing.
- **Nothing goes missing quietly.** A daily check alerts my phone if a save didn't make it through.

### 05 What I changed after launch

Brain started on n8n. Once it was running every day, I moved it to a tested Python package, with no data loss in the move. Today it has 1,476 tests and 545 commits, and it has run every day since April 2026.

### 06 What's next

- Raise hit@5 from 68% to the 75% target.
- Transcribe the audio of short videos.

---

## The Daily Diff: an AI morning brief, on paper too

**At 07:30 each day, about 190 candidates become about 18 picks, by email, podcast and receipt printer.**

Demo video: [FILL IN: video URL]. Caption it "Demo with sample data" unless the video's hook is changed to the real numbers (18 picks from 193).
Photo of a printed brief: [FILL IN: photo to follow]

### 01 Problem

Every morning there's more worth knowing than time to read it: saved links, GitHub trending, YouTube, Anthropic news. I keep forgetting where I save things. With The Daily Diff, I stay up to date on news, trends and AI security, and get reminded of my recent saves.

### 02 What I built

A morning brief that picks for me and arrives in three forms.

- **Ranks** my saves, GitHub trending, YouTube and Anthropic news.
- **Learns my taste** from 👍/👎 votes in my Reader app.
- **Delivers** a designed email, a NotebookLM podcast link, and a printed copy.
- **Prints on paper:** an HPRT TP808 80 mm thermal printer over Wi-Fi, driven by raw ESC/POS commands written by hand, including 1-bit weather icons drawn in code.

### 03 How it's running

From the brief notes, 19 October to 11 November 2026:

| What | Result |
|---|---|
| Briefs sent | 21 |
| Candidates per day | median 193 (range 65 to 268) |
| Picks per day | median 18 (max 22) |
| Podcast episodes | 18 made, 18 succeeded, 0 failed |
| Email arrival | about 07:34, printed copy right after |

*Figure idea: a recreated receipt on the page showing one day's brief, in the site's receipt style, next to the photo of the real printout.*

### 04 What went wrong, and what I changed

Around 6 to 9 November some briefs didn't go out: a Python upgrade blocked file access for the scheduled jobs. I fixed it and added a daily health check, so a silent failure like that now gets caught.

### 05 What's next

- If the printer is offline: retry, then alert my phone instead of skipping the print.
- Reader app v2: add Raindrop and Instagram as sources, and read-aloud.

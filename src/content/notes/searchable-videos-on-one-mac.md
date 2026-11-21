---
title: "Making saved videos searchable by what they show, all on one Mac"
description: "Short videos with music and no speech were invisible to my search. Now one Mac looks at the frames and writes down what is on screen. How it works, and the three ways it failed before I trusted it."
date: 2026-11-27 09:00:00 +0100
slug: searchable-videos-on-one-mac
topic: AI agents
---

## The gap

[Brain](/projects/brain/) turns what I save into notes I can search. Until this change, a saved short video became a note with three parts: its caption, the text on its cover image, and a transcript if anyone spoke. The cover text came from OCR (reading text out of a picture). The transcript came from local speech-to-text.

That works for a talk. It doesn't work for a video with music and no speech. Its note said almost nothing about what was on screen, so search couldn't find it.

The pipeline already downloaded each new video once. It did that logged out, at most two downloads an hour, with a 24-hour stop after any rate-limit answer. Then it asked only for the audio and threw the picture away.

## Keep the picture, do the rest locally

The change keeps that one download as a small video file, 720p where it can. Everything after it runs on the Mac:

- **ffmpeg** extracts mono 16 kHz audio for speech-to-text, and up to 8 frames. The first, middle and last frames and the quarter points come first, then strong scene cuts. Frames that are nearly the same are dropped.
- **Apple Vision** reads the text on screen in those frames. A filter drops text too tiny to read.
- **A local vision model** gets the frames as one contact sheet through Ollama, at temperature 0, with at most about 150 words and a 240-second timeout.

No cloud model sees the content. A note enriched this way is also summarised only by a local model.

It is still one download per video. An opt-in backfill for older videos shares the same hourly limit and the same 24-hour stop.

## Choosing the model on one video

Two models got one test video, with the same 8 frames and the same prompt:

| Model | Time |
|---|---|
| `qwen3.8:27b-q8_0` | 55.24 s |
| `gemma3:27b` | 18.86 s |

Gemma was faster. Qwen named more concrete details that I might search for, such as a screen mounted on a concrete wall, or a helmet in profile. I chose Qwen. That choice rests on one video.

The test video is a short logo animation: 6.40 seconds, 1080×1920, music and no speech. The full local run took 38.74 s cold and 19.32 s warm in Codex's run. In the canary after the final deploy, at 00:15 on 21 November 2026 (Spanish time, like every time here), it took 45.1 s.

Then the check that matters. Five queries described what is visible, such as "black leather jacket", "white helmet in profile" and "technical layout with grid lines". Run through the real full-text search code, each one got 0 hits on the old note and 1 hit on the new one.

## Three ways it failed before I trusted it

1. **One timeout took both parts down.** Claude's code review found that OCR and the model description ran one after the other, so an OCR timeout aborted both. This happened in practice: in Codex's own trials, Apple Vision timed out at 120 s in 3 of about 5 runs while other models were using the GPU. The two parts are now independent.
2. **A failed call looked like an empty video.** Review also found that a video with no text on screen was marked "no visuals" forever if its model call failed, for example while the model server restarted. That now counts as a failure, and it is retried.
3. **The first live failure saved half an answer.** After deploy, the canary met a busy GPU. The model call timed out, and the code saved the OCR text alone as the final result, on the first try. Now a partial result is saved only after the last of 3 local attempts. Retries reuse a private local copy of the video and never download it again.

Claude found the first two by reading the code. The third showed up only in the live canary, when the GPU was busy.

An older bug got fixed on the way. A video without speech counted as a speech-to-text failure, so the old code downloaded it three times before it gave up. The new code records silence as a normal result.

## The first real videos

At 00:30 on 21 November, two new videos were described in full. At 01:30, two more timed out under GPU load. They waited for a retry instead of losing their descriptions, which is the third fix doing its job.

## How the work was split

It used the [boss and worker split](/posts/claude-boss-codex-worker/) I use for most code. A Codex worker built it in its own git worktree. Claude supervised: it reviewed the code and sent the three fixes above back to Codex, one at a time. Then Claude ran the full test suite itself (2,473 passed and 1 skipped at the final deploy), installed it, and kept a written rollback.

## What I keep

Two of the three failures had the same shape: a step that failed left a result that looked finished. An empty description looked like a video with nothing to see. OCR text alone looked like a complete note. The fixes make a failed step look like a failure until the last retry is spent.

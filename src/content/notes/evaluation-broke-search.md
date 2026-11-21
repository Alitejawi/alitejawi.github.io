---
title: "Our evaluation broke live search, and the fallback hid it"
description: "One Mac serves my live search and every test of it. A safety fallback made a broken step look like normal results, and leftover evaluation jobs took down the system they were measuring."
date: 2026-12-01 09:00:00 +0100
slug: evaluation-broke-search
topic: AI agents
---

## One GPU, many clients

Everything here happened on 20 and 21 November 2026, on the machine that runs [Brain](/projects/brain/). All times are Spanish time.

That machine is one Mac Studio with 128 GB of memory. It serves the live search and every evaluation of it. Ollama runs the embedding model (`qwen3-embedding:4b`) and the chat and vision models. A reranker, `bge-reranker-v2-m3` at Q8, runs in `llama-server` with one slot (`--parallel 1`). A reranker reads the query together with each candidate note and puts the candidates in a better order.

A search builds a shortlist of 30 notes and asks the reranker to reorder it. The client waits 2.4 s. After that, it falls back to the order it had before reranking.

The results look normal either way. That is the whole problem.

## The reranker almost never answered

A Codex worker was evaluating search, to find out why some searches missed. In its live window, the reranker finished 4 of 286 known-item searches (looking for one note I know I saved) and 0 of 40 topic searches. The other 322 fell back.

Live latency, as p50/p95 (the median, and the time 95% of searches beat):

| Search type | p50 | p95 |
|---|---|---|
| Known item | 3.223 s | 4.128 s |
| Topic | 3.187 s | 4.337 s |

Claude, which supervised that worker, checked directly at 00:16 on 21 November. 8 of 8 searches fell back. Then it timed the reranker on its own:

| Request | Time |
|---|---|
| 3 short documents | 0.10 s |
| 15 documents of 1,200 characters | 1.32–1.44 s |
| 30 documents of 1,200 characters | 2.83–3.01 s |

With one slot, the reranker scores documents one after another. 30 documents of 1,200 characters took longer than the 2.4 s the client waits.

## Fine alone, broken in company

Later, in a quiet window, the unchanged setup finished 323 of 326 searches.

Then the reranker got load tests. Alone, it completed 30 of 30 calls, at p50/p95 2.09/2.27 s. With a second client running at the same time, only 18 of 30 foreground calls completed, and 30 of 60 calls across both clients fell back.

More server slots made that worse. Under the same paired load, 16 of 60 calls completed with 4 slots, and 7 of 60 with 8.

## A faster setting, rejected

A smaller request, 15 notes of 800 characters, always finished: 326 of 326, with p95 at 1.47 s on known-item searches and 1.17 s on topics.

But it put the right note in the top 5 for 95 of 100 entity searches instead of 97. Under the decision rule agreed before the test, that is a loss, so it was rejected. The sealed held-out test set (questions kept back for the final check, so tuning can't fit to them) was never opened, and the deployed settings stayed.

## The outage

Leftover evaluation jobs from a second agent session kept a 27B chat model busy from about 01:22. While it was busy, Ollama would not load the embedding model. Live search could not embed queries, which means it could not turn them into the numbers that vector search compares. The hourly index refresh failed at 02:38, and the old index was kept.

It recovered on its own. Every hourly refresh from 04:54 to 08:54 succeeded, and embedding answered in 1.1 s at 09:00.

The evaluations were there to measure live search. From about 01:22, they were the reason it didn't work.

## The guard that said no

Claude tried to pause the other session's two processes. Its permission guard refused, because they were another session's work.

That was the right call. Claude protected only what it owned. It held the lock of the [video job](/posts/searchable-videos-on-one-mac/), so two videos kept their last retry.

## Results that look like success

This is the same family of failure as the one that hid a broken step in Brain for ten weeks, written up on the [Brain page](/projects/brain/#what-i-changed-after-launch). There, failures were recorded as data, so every run finished as a success. Here, a timed-out reranker produced a normal-looking list in the old order. Nothing on the page said the reranker was missing.

A fallback keeps a system up. It also hides that something underneath is broken, unless it is counted.

## What I'm changing

- Evaluations get their own window, right after the hourly index refresh.
- The video job pauses during that window.
- When the refresh fails, the first things to check are a model stuck in "Stopping" and long-running clients.
- Every quality measurement counts a fallback as a failure.

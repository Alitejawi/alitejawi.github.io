---
title: "Building this site with AI agents: the rules, the tests, and the rule no test can check"
description: "Claude and Codex wrote most of the code on this site. I wrote the rules. Where the rules live, how they turn into tests, what a second agent's review caught, and the one rule a test can't check."
date: 2026-11-21 09:00:00 +0100
slug: building-this-site-with-ai-agents
topic: AI agents
---

## One evening, then the rules

I rebuilt this site in November 2026, moving it off a Jekyll theme. Claude Code wrote most of it, in a session I talked to. Codex reviewed the work and took some of the longer jobs. I've written up [how the two split the work](/posts/claude-boss-codex-worker/) separately.

The first version came together in one evening. The design doc and the plan went in at 22:17 and 22:20 on 11 November, the first page of the new site at 22:48, and the not-found page, the last piece, at 01:44.

Two of that evening's commits exist only to take things back. The first drafts of the case studies made claims the source code didn't support. One of the corrections was itself wrong, until I checked it on the machine that runs Brain.

Speed was never the problem. Trusting what came out fast was. So most of the work since has gone into rules, and into checks that hold the agents to them.

## The rules live in one file

`AGENTS.md` sits at the root of the repository. Claude Code and Codex both read it before they start. It has seven rules, including these four:

- **Never name an employer.** No current or former employer, client or colleague, anywhere: pages, alt text, metadata, tests, commit messages.
- **Everything is true and checkable.** A number that was measured on a date keeps its date.
- **Nothing reaches `main` without my go-ahead** for that change.
- **No third-party requests.** No page loads anything from another site.

A rule I say in chat is gone by the next session. A rule in the file is there every time, for every agent, and I can point at it.

## Rules that turn into tests

An agent can break a rule quietly, so most rules have a test that fails loudly. GitHub runs all of them on every pull request and again before every deploy. On 20 November that was 101 build checks and 197 browser checks.

- **No third-party requests:** a browser opens every page in the sitemap, and the test fails if the page contacts any other site.
- **A measured number keeps its date:** each project result on the homepage has to carry the date it was measured, and its numbers have to match the case study's.
- **Post dates stay hidden:** no date on a post, on the writing page, or in the data that search engines read.
- **Phones:** every page loads at 375px wide without sideways scrolling, and nothing may move more than 0.005 on the browser's layout-shift score while it loads.
- **Motion:** the README note, the decode effect, the ticker, the fade-ins and the printer each have a test that they stay still for visitors who turn motion down.

Every change takes the same path: a branch, a test written first and watched failing, a draft pull request, the checks, a preview I look at, and then my "ship". From 18 to 20 November, that was nine pull requests.

## A test that passed too early

Watching the test fail first sounds like ceremony. Here it caught a real problem. The check that project results carry their dates passed before the feature existed: no project had a date yet, so the check had nothing to look at.

A test that passes before the work is done isn't testing the work. The fix was to add the dates first, watch the test fail on pages that didn't show them, and only then change the pages.

## The rule no test can check

The first rule has no real test. A test that looks for my employers' names would have to contain those names, in a public repository.

The only automated check is structural: the data that describes me to search engines has no employer field. Everything else is me, reading every diff before I say ship.

## A second agent reads the whole site

Tests only check what someone thought to check. On 20 November I asked Codex for a full review of the repository. Claude checked each finding against the code and in a browser before it reached me, and all five held up. Three of them:

- **The README button covered the text.** On a 375px phone, it covered words in the Brain case study at 70 of 83 scroll positions. The test for that button only checked the footer links.
- **Two project results had no dates,** against rule two.
- **The espresso counter could count a day twice.** A scheduled job adds to the counter on the homepage, and a second run on the same day added that day again.

All three were fixed the same day, each with a test that failed first.

## What still went wrong

- **Launch day.** The custom domain dropped, and the site returned 404. GitHub Pages was still set to publish from a branch, and the file that names the domain had moved. Switching Pages to deploy from the workflow and setting the domain again fixed it. A test now checks that file.
- **Late fonts.** On a slow connection, text re-wrapped when the web font arrived and pushed the page down. Layout-shift scores were 0.016 to 0.046, measured on 17 November 2026. A local fallback font, scaled to the web font's proportions, now keeps the line breaks where they are.
- **Scheduled jobs run late.** GitHub has started the espresso job up to ten hours late. The job now counts by date, so a late run still counts the right day.

## What I keep

The agents write the code, the tests and first drafts of the words. I write the rules, check every number against where it came from, and decide what ships. When a fact in a draft can't be checked from the repository, the rules tell the agent to ask me instead of guessing.

The same loop works anywhere agents touch real systems: rules in one file, a test for every rule that can have one, a second reviewer, and a person who says ship.

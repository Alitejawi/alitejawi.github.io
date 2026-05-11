---
title: Three GAM commands I run every Monday morning
date: 2026-05-11 09:00:00 +0200
categories: [cli]
tags: [automation, security]
description: When you manage Google Workspace at scale, three things drift weekly. The GAM commands that catch them before your auditor does.
---

# Quiet, but never empty.

A Workspace tenant with a few thousand users is never at rest. Admins get added, delegates accumulate, OAuth apps get reauthorized. Most of it is fine. Some of it is not, and the boring three-command sweep I run every Monday morning catches the things that aren't.

These commands are short. What makes them useful isn't the command itself — it's the API call underneath each one, and what you do with the diff against last week.

## 1. Active super admins, plus when they last signed in

```sh
gam print users query "isAdmin=True" allfields
```

Under the hood this hits `users.list` with `query=isAdmin=True`. The output you want is small: every super-admin, their last-sign-in time, and which delegated admin roles they hold. Diff against last week. If the row count changed, somebody got promoted; you want to know who and why.

The thing this catches: a vendor or contractor was elevated for a one-off task and the elevation didn't get reverted. The Workspace admin console doesn't surface elevation history nicely. The API does.

## 2. Every delegate, on every mailbox

```sh
gam all users print delegates
```

This wraps `users.settings.delegates.list` and runs it across every account. The result is one row per delegate relationship. Diff against last week. New rows are either legitimate (a new EA, a shared inbox) or, occasionally, an artifact of an old offboarding that ran in the wrong order.

You catch two real things here:

- Ex-employees who still hold a delegate on a current employee's inbox because the offboarding revoked the wrong direction first.
- Cross-org delegations created during M&A integration that nobody documented.

If you wrote about silent delegation already (I did), this is the inverse — a routine sweep that surfaces the silent delegations someone else created.

## 3. OAuth scopes granted in the last seven days

```sh
gam report token start_time -7d
```

This hits `reports/v1/activity/users/all/applications/token`. You're looking for new third-party apps that received broad scopes — anything with `gmail.readonly`, `drive`, or `admin.directory` is worth a look. The report endpoint is more honest than the OAuth audit page because it logs at grant time, not at next-use, so revoked-then-re-granted tokens show up.

Weekly cadence is right for this one. Daily is too noisy, monthly is too late.

## What to do with the output

I keep the diffs in a folder, one per command, dated. Most weeks the diffs are empty or trivial. The point isn't the diff itself — it's that the muscle of running these three exists, so when something does change, the change is visible against a stable baseline.

If you want to automate this further, wrap each command in a small n8n workflow that posts the diff to a Slack channel. The channel will be quiet most weeks. That's the goal.

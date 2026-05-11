---
title: Three GAM commands I run every Monday morning
date: 2026-05-11 09:00:00 +0200
categories: [cli]
tags: [automation, security]
description: When you manage Google Workspace at scale, three things drift weekly. The GAM commands that catch them before your auditor does.
---

# Quiet weeks are the goal.

A Workspace tenant with a few thousand users means a lot of small things move every week. Some admin got added for a one-off task. A delegate was set up. Somebody granted a scope to a tool they're trying out. Most of it is fine, a small slice of it isn't, and the boring sweep I run every Monday is how I tell the difference between the two.

It's three commands. What does the work isn't the command itself, it's the API call underneath it and the diff against last week.

## 1. Active super admins, and when they last signed in

```sh
gam print users query "isAdmin=True" allfields
```

Under the hood this hits `users.list` with the filter `isAdmin=True`. The output is small. You get every super-admin, their last sign-in, and the delegated admin roles they hold. Diff it against last week. If the row count changed, somebody got promoted and you want to know who, and why.

What this usually catches is a vendor or a contractor who got elevated for a one-off task and never got reverted. The Workspace admin console doesn't surface elevation history in a useful way. The API does.

## 2. Every delegate, on every mailbox

```sh
gam all users print delegates
```

This wraps `users.settings.delegates.list` and runs it across every account in the tenant. You get one row per delegate relationship. Diff against last week.

New rows are usually legitimate. A new EA, a new shared inbox. Occasionally one is an artifact of an offboarding that ran in the wrong order, and you find two things you wouldn't have found otherwise. Ex-employees who still hold a delegate on a current employee's inbox, because the offboarding revoked the wrong direction first. Or cross-org delegations created during an acquisition that nobody bothered to document.

If you read my post on silent delegation, this is the inverse. A weekly sweep that surfaces the silent delegations somebody else set up.

## 3. OAuth scopes granted in the last seven days

```sh
gam report token start_time -7d
```

This hits `reports/v1/activity/users/all/applications/token`. You're looking for new third-party apps that got broad scopes. Anything with `gmail.readonly`, `drive`, or `admin.directory` is worth a second look.

The report endpoint is more honest than the OAuth audit page in the admin console because it logs at grant time, not at next-use. Revoked-then-re-granted tokens still show up there, which is exactly when you want to see them.

Weekly is the right cadence for this one. Daily is too noisy, monthly is too late.

## What to do with the output

I keep the diffs in a folder, one per command, dated. Most weeks the diffs are empty or trivial. The point isn't the diff itself, it's that the muscle of running these three commands every week exists, so when something does change, the change is visible against a stable baseline.

If you want to automate it further, wrap each command in a small n8n workflow that posts the diff to a Slack channel. The channel will be quiet most weeks. That's the point.

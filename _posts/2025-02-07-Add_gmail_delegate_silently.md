---
title: How to add a Google Workspace delegate without notifying the user
date: 2025-02-07 21:40:00 +/-TTTT
categories: [cli]
tags: [automation, security]
description: GAM's users.settings.delegates.create call skips the confirmation email when invoked with admin credentials. A one-line command, the API mechanics, and why this works.
---

# Silent, but not invisible 

For a while I had been trying to see if there was a possible way to add a delegate to a Google Workspace account without notifying the user. There's numerous reasons why you would want to do that and this post isn't about the intricacies on why you might not want to do that. 

## Default delegation

When you want to delegate a mailbox in Google Workspace, the de-facto way of doing this would be to set that up in the Settings of the inbox itself. You would click on `Settings` and then `See all settings`, `Accounts`.\
In the "Grant access to your account" section, click `Add another account`.

Now while this is straight forward where a user is delegating their account, this might not fit your need when you want to do this silently. 

## Delegation using GAM

When you use [gam](https://github.com/taers232c/GAMADV-XTD3) to do this, the magic happens at the API level. GAM calls the Gmail API's `users.settings.delegates.create` endpoint with admin credentials, and that endpoint has a documented shortcut: when the caller has admin authority over the mailbox, the delegate is added with verification status `accepted` immediately and the confirmation email is skipped entirely.

The command itself is a one-liner:

```sh
gam user user@yourdomain.com delegate to delegate@yourdomain.com
```

Both addresses must live in the same Google Workspace tenant — Google does not allow delegating to external addresses regardless of how you set it up.

To confirm it landed:

```sh
gam user user@yourdomain.com show delegates
```

You should see the new delegate listed with `Status: accepted`. They can now open the mailbox via Gmail's account switcher without ever receiving an email.

## What "silent" actually means here

Here's the catch the title hints at. The change is silent at delivery, but it is not hidden after the fact.

Anyone who opens the delegating user's `Settings` → `See all settings` → `Accounts` → "Grant access to your account" section sees the delegate listed there, exactly as if the user had added it themselves. There is no "added by admin" badge, no separate audit surface in the user's mailbox UI.

So for offboarding workflows, deceased-employee mailboxes, or temporary access during an extended leave, GAM gets you in cleanly. For anything where a curious user might check their own settings page, plan accordingly — the trail is in plain sight on the user's own settings screen, even if their inbox stays quiet.

## Removing the delegate

When you're done, drop the delegate the same way you added it:

```sh
gam user user@yourdomain.com delete delegate delegate@yourdomain.com
```

Same rules: silent at delivery, immediately reflected in the user's Settings → Accounts page.
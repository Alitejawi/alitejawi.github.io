---
title: "Claude is the boss, Codex is the worker: splitting work between two coding agents"
date: 2026-11-14 09:00:00 +0100
description: "I pay for two coding agents. One plans, checks and reports. The other does the long, heavy jobs in a tab I can watch. The rules that decide who does what, the loop that hands work over, and where it still breaks."
slug: claude-boss-codex-worker
topic: AI agents
---

## The problem

I have two coding agents on two plans: Claude Code and OpenAI's Codex. For a while I used whichever one was open. One plan would hit its limit in the middle of a job while the other sat idle, and two agents in the same folder would sometimes edit the same files.

I wanted one simple rule for who does what, and I wanted to be able to watch the work happen.

## The split

Claude is the boss. Codex is the worker. Claude talks to me, and Codex talks to Claude. If I give an order myself, my order wins.

The rule lives in the instruction file Claude reads at the start of every session. A shortened version:

```markdown
### Send to Codex when
- The job is long (more than ~10 minutes of agent work) or touches many files.
- Deep debugging or root-cause hunts in code.
- Self-contained builds: scripts, tools, refactors, test suites.
- Two or more independent tasks can run in parallel.

### Keep in Claude
- Any production API change (tenant checks, dry-runs, downstream-app rules).
- Anything that needs connectors: Slack, Gmail, Calendar, Notion, Linear.
- Planning, judgment calls, verification of Codex output, and every report to me.
```

Two lines in there matter most.

**Production stays with the boss.** My day job is identity and Workspace administration. A change to a live tenant needs checks, a dry run and an approval. That happens in the session I am talking to, not in a background worker.

**Verification is never delegated.** The agent that did the work is the worst one to judge it.

## The loop

Both agents run inside Orca, a desktop app that gives every agent its own terminal tab and worktree. Orca also has an orchestration CLI. Claude uses it to hand out work and get results back:

```bash
orca orchestration run-create  --objective "<goal>" --json
orca orchestration task-create --spec "<task>" --json
orca orchestration worker-start --task <id> --worktree current --agent codex --json
orca orchestration check --wait --types worker_done,escalation,question \
  --timeout-ms 900000 --json
```

`worker-start` opens a new Codex tab, and I can watch it type. When the worker finishes, it sends a `worker_done` message. Claude then reads the diff, runs the tests and checks the task's acceptance criteria. Only after that does it commit and tell me. Then it releases the worker, which closes the tab, and acknowledges the message.

When a worker gets stuck, it sends a `question` instead, and Claude answers it with `orca orchestration reply`. If Claude can't answer, the question comes to me.

Claude first proposed a fully autonomous setup: Codex reviewing its own work, approvals turned off, agents starting other agents. I turned it down twice. I don't need a robot team that works while I sleep. I need two windows I can follow, and one of them reports to me.

## The brief is the work

A Codex worker sees none of my conversation with Claude. All it gets is the task spec. So every spec has to stand on its own:

- the exact files to touch
- the change, in one or two sentences
- the acceptance criteria
- the command that proves it works
- the commit rule (by default: "do not commit; the boss commits")

When a worker comes back with something odd, the cause is almost always a missing line in the brief, not a weak model. Writing the brief also forces Claude to know what it wants before work starts. If it can't write a clear brief, it doesn't understand the task yet.

## Why the boss checks everything

My delete-lock note has the clearest example. A coding agent built the first version from a written spec and reported 441 passing checks. Then I wrote my own adversarial probes, and ten of them got through.

The worker hadn't lied. Its tests checked what it had built, not what I needed. That is why the rule says "never report Codex output unverified": Claude reads the actual diff, runs the project's own test suite, and checks the result against the spec, not against the worker's summary.

## Cheap where it can be

The same idea applies inside Claude. When Claude spawns its own helper agents, it has to pick the model on every call:

- the small model for mechanical bulk work
- the mid model by default
- the large model for concurrency, subtle algorithms and hard debugging

The most expensive model is never chosen by the agent on its own. It has to ask me first. The idea is that a strong model planning and checking, with cheap workers doing the bulk of the work, gets close to all-premium quality for much less money. I haven't measured that yet.

## What broke while I set it up

- **Untrusted hooks blocked startup.** Orca runs Codex workers with their own managed config folder. My hooks were trusted in my normal Codex config, but not in that copy. Codex stopped at a "hooks need review" prompt, and `worker-start` failed at `agent_readiness`. The fix was to remove dead hooks and trust the rest in the managed config. Don't just click "trust all".
- **The sandbox couldn't see Orca.** Inside its default sandbox, Codex couldn't reach the running Orca app, so it couldn't message Claude back. The report command has to run outside the sandbox, through an approval or a looser sandbox setting.
- **A tab keeps the config it started with.** After I change Codex config, I restart the open tabs and check inside a running worker. A config edit by itself proves nothing.
- **Never blindly retry a mutation.** If a message gets lost, Claude follows Orca's recovery steps instead of sending the same task again. Otherwise two workers end up doing the same job.

## The catch

The boss can only check what it checks. If the spec misses a case, both the worker's tests and the boss's review can miss it. My delete lock was only caught because I tested it myself.

Codex workers don't run Claude Code's hooks either, so guardrails that live in those hooks, like my delete lock, don't apply to them. Production work stays with Claude for that reason too.

And it costs attention. Reviewing a diff takes time, and some small jobs are faster to do than to brief. My rule of thumb: if writing the brief takes longer than the task, the boss just does it.

---
title: "A delete lock for AI agents: parsing shell commands in a PreToolUse hook"
date: 2026-11-12 13:00:00 +0100
description: "Telling an agent 'never delete' is a prompt. A hook that parses the command and blocks it is a control. How I built one, the ten misses in my first version, and the gaps it still has."
slug: delete-lock-for-ai-agents
topic: AI agents
---

## The problem

My agents run admin CLIs against my production systems, and my standing rule is that nothing gets deleted until I say yes. That rule is written into the instruction files every agent reads.

That's a request. An agent that's confused, or that picked up a bad instruction from a file it read, can still type the command. I wanted something that doesn't depend on the agent agreeing with me.

## The hook

Claude Code can run a `PreToolUse` hook before every tool call. The hook gets one JSON object on stdin with the tool name and its input. Exit code 0 lets the call run. Exit code 2 blocks it, and whatever the hook writes to stderr goes back to the agent as the reason.

A simplified entry in `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|mcp__.*",
        "hooks": [
          { "type": "command",
            "command": "/path/to/delete-lock --mode log",
            "timeout": 5 }
        ]
      }
    ]
  }
}
```

The matcher covers shell commands and every MCP tool. The hook reads `tool_input.command` and never runs it, so the command is only ever a string to inspect.

The global entry runs in log mode, and deny mode switches on per session (section 05). One more setting matters: what happens when the hook itself fails, times out or can't start. Claude Code has an `onFailure` field for that. I haven't set it, so check what your version does before you rely on the hook as a gate.

## Parsing the command as data

A regex for `delete` isn't enough. `echo "delete"` is harmless, and `sudo timeout 30 gam user x delete drivefileacl` isn't. So the hook has its own small shell lexer. It splits the input into simple commands and keeps quoting meaningful, which means a quoted example doesn't count as a command. It also pulls out heredoc bodies and the insides of `$(...)` and backticks, and checks those as scripts too.

Then it strips the wrappers off each command until the real program shows. The wrapper list is data: `env`, `sudo`, `time`, `nohup`, `timeout`, `nice`, `xargs`, `eval`, `direnv exec`, `bash -c`, and seven more. Depth is capped at 24.

A simplified excerpt:

```python
def shell(self, source, depth=0):
    if depth > MAX_DEPTH:
        raise ValueError("too deep")           # caller blocks
    try:
        commands, substitutions = self.lex(source)
        for inner in substitutions:             # $(...) and `...`
            if hit := self.shell(inner, depth + 1):
                return hit
        for words in commands:
            if hit := self.command(words, depth):
                return hit
    except Unparsed:
        # Broken quoting: boundaries are lost, so scan every
        # token run as if it started a command.
        tokens = re.findall(r"[^\s;|&()]+", source)
        for i in range(len(tokens)):
            if hit := self.command(tokens[i:], depth):
                return hit + "-unparsed"
    return None

def command(self, words, depth):
    while words:
        wrapper = WRAPPERS.get(basename(words[0]))
        if not wrapper:
            break
        if wrapper.kind == "shell":             # bash -c "<script>"
            return self.shell(script_arg(words), depth + 1)
        words = strip_options(wrapper, words[1:])
    return match_rules(words)
```

In deny mode, `main()` exits 2 on its own errors: bad JSON, a missing rules file, a command nested deeper than 24. Input the lexer can't parse is different. The fallback scan checks the raw words, and if no rule matches, the call runs. So the lock fails closed on its own errors, but not on every confusing command. Closing that gap is next.

## Rules are data too

No pattern lives in the script. One JSON file holds the rules, and each rule has a program regex plus some mix of words, flag pairs and argument patterns. Some generic examples of what it covers:

- an admin CLI with `delete`, `remove`, `suspend`, `purge`, `clear`, `sync`
- `gh ... delete`, `kubectl delete`, `terraform destroy`
- an HTTP `DELETE` through curl, httpie, or inline Python or Node
- lifecycle endpoints such as `/lifecycle/deactivate`, when the call goes through curl, httpie, `gh` or one of the API wrapper scripts
- MCP tools whose name contains a word such as delete, remove, revoke, archive, trash or wipe

It reads batch files too. When the admin CLI gets `batch file.csv`, the hook opens the file and parses the lines as a script. If it can't read the file (over 1 MiB, a FIFO, missing), that counts as a match.

## Rollout: log first, then deny

I didn't turn it on cold. Phase A was log-only: the hook wrote a JSON line for every match and let the call run. I read that log against what I had done that week before I trusted the rules.

Phase B added deny mode. A session runs in deny mode when its terminal is on a short deny list. Today that covers sessions that should never delete anything, such as the read-only support-desk sessions, and there it blocks outright. Everywhere else it still logs, and a separate approval step is the gate.

## What went wrong, and what I changed

A coding agent built the first version from a written spec. It reported 441 passing checks. Then I wrote my own adversarial probes, and ten got through, in four groups:

- Admin API wrapper scripts called as `wrapper <tenant> <path> -X DELETE`. My method rule only applied to `curl`. It now applies to any program.
- `timeout`, `exec`, `nice` and `eval` in front of the program. I added `caffeinate` and `stdbuf` in the same fix.
- Commands inside brace groups. I added `while` and `until` loops in the same fix.
- More destructive words on the admin CLI: `clear`, `sync` and `empty`. I added `revoke` in the same fix.

I wrote a follow-up spec listing each one, with a must-still-pass list next to it (`grep -rn "lifecycle/deactivate" docs` must not trip the lock). On 2 October 2026 the fixed build passed all 557 checks at 35.5 ms per call. Then I ran 81 probes of my own and logged none wrong. I didn't save the probe set, so that number rests on my log. After that I tried it in a live session, in log mode and in deny mode. On 12 November 2026 the suite ran 562 checks, all passing.

Later, a worker on the deny list tried an HTTP delete and got the block message back. So the lock has now stopped a real agent as well as my test strings.

## The catch

The lock reads commands and knows nothing about intent. It doesn't see a wrapper script that deletes without a visible method or word, such as a GitOps apply. The agent also sees the stderr message, so I keep it short and make it say who runs the command instead.

It also has gaps I know about. The matcher covers shell and MCP calls only, so file edits aren't checked, and an agent could edit the rules file, the hook or the deny list. Codex workers don't run Claude Code hooks at all. In log mode none of this matters, because nothing is blocked anyway.

If you build one, treat it as one layer. Mine has an approval step behind it.

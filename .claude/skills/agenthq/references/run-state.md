# Run state and visible status

AgentHQ must make it obvious whether it is working, blocked, or finished.

## Persistent state

Store one small state file per active run under:

`~/.claude/agenthq/runs/<github-owner>/<repository>/<feature-slug>.json`

Never store prompts, source code, credentials, tokens, secrets, or raw command output. Record only:

- Repository, canonical path, origin, base branch, working branch, and spec path.
- Stage: `preflight`, `contract`, `design-review`, `implementation`, `verification`, `local-preview`, `awaiting-visual-approval`, `handoff`, `blocked`, or `complete`.
- Feature/task graph, execution waves, per-feature and per-task status, time budgets, elapsed time, verification tiers, checkpoints, review round, implementation chunk, concise decision ledger, completed checks, local preview URLs and recorded process identifiers, current blocker, next action, and updated timestamp.

Write state only at stage transitions, user decisions, and chunk completion. On a later invocation for the same repository, inspect incomplete state and use the question popup to offer `Resume (Recommended)`, `Start a new run`, or `Inspect only`. Verify Git state before trusting saved state.

## Status card

At startup, execution-wave boundaries, every user-facing wait, and completion, print:

```text
AgentHQ status
Project: <repo>  Branch: <branch>
Stage: <stage>  Review: <round>/3  Build: <chunk>/<total>
Features: <complete>/<total>  Tasks: <complete>/<required-total>
Working: <current action or no>
Waiting on you: <no, or exact decision>
Next: <next action>
```

Keep internal capability routing and state transitions quiet. During a healthy task, provide a compact heartbeat only when it runs for roughly 10 minutes or materially changes status. A blocking decision must also invoke `AskUserQuestion`; a status card is not a substitute for the popup.

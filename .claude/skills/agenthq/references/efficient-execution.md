# Efficient execution and checkpoint policy

Read this reference before scheduling implementation. Optimize elapsed time without weakening acceptance, safety, or final verification.

## Choose the lightest profile

Use `auto` unless the user explicitly chooses otherwise. Show the selected profile once; do not ask for approval when the recommendation fits.

- `fast`: one low-risk feature with no more than three tasks. One worker, one focused review, compact status, no worktrees. Use for small fixes, pages, and straightforward additions.
- `standard`: ordinary multi-task features. Up to two concurrent read workers, one writer, focused plus feature verification, normal status. This is the default for typical work.
- `full`: more than three features, more than eight tasks, high-risk or broad cross-cutting work. Up to three readers and two isolated worktree writers, detailed integration and gates.

If an explicitly selected profile is lighter than the control-plane recommendation, show the risk and continue only when its safety and verification requirements can still be met. Advanced capabilities remain available but inactive outside their triggering conditions.

## Size work for useful feedback

- Estimate each task from repository evidence and keep ordinary implementation tasks within a 15–45 minute working budget.
- A task must produce one reviewable outcome. Split tasks that combine several services, journeys, migrations, or unrelated test areas.
- Finalize shared schemas, interfaces, design tokens, and security rules once before dependent tasks begin.
- Carry forward accepted decisions, verified commands, repository facts, and test baselines in run state. Do not repeat a broad audit unless the relevant files, branch, specification, or environment changed.
- Give workers only the canonical spec section, task contract, allowed paths, dependencies, and relevant evidence. Avoid repeatedly sending the entire run transcript.

## Verification tiers

Use three tiers and record which tier each task requires:

1. `focused` — fastest relevant tests, lint/type checks, or direct runtime assertion for the changed behavior. Run after each implementation task.
2. `feature` — all tests and journeys for the integrated feature, including adjacent contracts. Run after an execution wave or feature integration.
3. `full` — the repository-wide required suite, full visual/security/cost checks, and final diff. Run before handoff and earlier only when a shared foundation or high-risk change can affect the whole product.

Do not run the full suite after every small task when focused evidence can detect its failures. Never omit the final full suite or a repository-mandated check.

## Parallelism

- Run independent read tasks concurrently, up to the control-plane limit.
- Run at most two write tasks concurrently, only in approved isolated worktrees with non-overlapping ownership.
- Keep database/schema migrations, shared configuration, global routing, generated artifacts, and integration work sequential unless repository tooling proves isolation.
- Start the next eligible wave as soon as dependencies and evidence allow; do not wait for unrelated read-only work.

## Heartbeats and checkpoints

- Show a short status heartbeat roughly every 10 minutes during long execution: active task, elapsed time, last evidence, and next checkpoint.
- At 30 minutes without a meaningful artifact or new passing evidence, create a checkpoint and investigate the delay.
- At the task budget, save changed paths, diff summary, commands/results, progress evidence, and exact next action. Continue from the checkpoint when there is concrete progress or a known healthy long-running command.
- Pause automatic continuation only when progress is stalled, evidence is absent, scope expanded, or a safer split is available. Then split the task, retry a smaller task, or request an explicit extension when splitting would be harmful.
- A known long-running deterministic command may exceed the budget; report its process and progress evidence rather than restarting it.
- Never discard completed work merely because a budget was reached.

## Avoid duplicated cost

- Reuse one healthy local stack across related verification tasks.
- Cache dependency installation and stable fixtures; preserve lockfiles.
- Do not have Claude and Codex independently perform the same exhaustive scan unless the independent comparison is the purpose of the task.
- Use one broad Codex design review, then focused follow-up reviews for changed or unresolved sections.
- Inspect changed scopes after each task and the complete diff at feature and final boundaries.

## Status evidence

For each task record the selected profile, time budget, elapsed time, verification tier, commands executed, latest passing evidence, checkpoint summary, and whether an extension was approved. Keep these mechanics in persistent state; show them to the user only when they explain current work, a delay, or a decision. Speed is never inferred from token count or a spinner.

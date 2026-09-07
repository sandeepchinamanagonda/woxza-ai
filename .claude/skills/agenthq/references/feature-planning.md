# Feature decomposition and status

Read this reference after establishing the canonical specification and before design review or implementation.

## Decompose by product feature

Convert the specification into user- or operator-visible features, then divide each feature into bounded tasks. Do not organize the top level merely by technical layers such as `frontend`, `backend`, or `database`; those are tasks or workstreams inside a feature unless they are genuinely shared platform foundations.

A feature must have:

- Stable ID and concise name.
- User or business outcome.
- Included behavior and explicit exclusions.
- Acceptance criteria copied or derived from the canonical specification.
- Dependencies on other features or shared contracts.
- Required capabilities, selected skills/tools, and the reason for each selection.
- Risk and cost class.
- Ordered tasks, including relevant design, frontend, backend, data, security, and verification work.
- Evidence required before the feature can be complete.

Use stable task IDs such as `F01-T01`. Each task records its outcome, inputs, outputs, dependencies, read/write mode, expected file scope, selected worker/tool, parallel-safety classification, user gate, time budget, verification tier and commands, checkpoint, and current status.

## Dependency and execution rules

- Derive a feature/task dependency graph and execution waves before starting implementation.
- Parallelize only tasks whose dependencies are satisfied and whose outputs or write scopes cannot conflict.
- Read-only analysis may share a repository. Parallel code-writing requires isolated worktrees and explicit file ownership.
- Finalize shared design, API, schema, and security contracts before dependent implementation tasks run in parallel.
- Schedule one integration and verification task after parallel implementations converge.
- A newly discovered requirement becomes a `proposed` feature or task. Do not silently expand the approved scope; use the question popup when accepting it changes product scope, cost, security, data, or delivery expectations.

## Status model

Use only these feature/task statuses:

- `proposed`: derived but not yet part of the approved execution plan.
- `blocked`: cannot proceed; name the exact blocker and owner.
- `ready`: dependencies are satisfied and work can be scheduled.
- `in_progress`: a worker is actively executing it.
- `verifying`: implementation is finished but required evidence is incomplete.
- `complete`: every acceptance criterion has passing evidence and integration is verified.
- `failed`: bounded attempts were exhausted; preserve evidence and next recovery choice.
- `deferred`: explicitly removed from this run with a reason.

Feature status is derived from its required tasks; never mark a feature complete because a worker reported success. A feature becomes `complete` only when every required task is complete and its integrated acceptance criteria pass.

## Feature dashboard

Show this dashboard after planning, at every execution-wave boundary, whenever a feature becomes blocked or fails, and at handoff:

```text
AgentHQ feature status
Run: <run-id>  Project: <repo>  Branch: <branch>

| ID  | Feature                 | Status      | Tasks | Depends | Current work / blocker |
|-----|-------------------------|-------------|-------|---------|------------------------|
| F01 | Account access          | complete    | 6/6   | —       | Acceptance verified    |
| F02 | Portfolio analysis      | in_progress | 3/7   | F01     | F02-T04 API work        |
| F03 | Analysis dashboard      | blocked     | 1/5   | F02     | Waiting for API contract|

Overall: 1/3 features complete; 10/18 required tasks complete
Working now: F02-T04
Waiting on you: no
Next wave: F02-T05, F02-T06
```

Report exact task counts instead of subjective percentages. The dashboard is a summary; the persistent run state remains the source of recovery information.

## Handoff

The final report lists every feature and task with its terminal status and evidence. Incomplete, failed, blocked, or deferred items must remain visible; never hide them inside a general success summary.

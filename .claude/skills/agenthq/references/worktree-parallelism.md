# Worktree-based parallel implementation

Use this reference only when an execution wave contains two or more independent write tasks.

## Eligibility

Parallel writes are allowed only when all are true:

- Shared UX, API, schema, security, and migration contracts are approved.
- Every task has complete dependencies, a bounded outcome, and an explicit non-overlapping write scope.
- Each task receives its own branch and Git worktree created from the same verified base.
- The repository is clean before worktree creation and no pre-existing user branch or path would be overwritten.
- One integration task owns convergence and full verification.

Otherwise execute sequentially in the canonical working tree.

## Worker contract

Give each Codex worker the canonical spec, task ID, allowed paths, prohibited paths, acceptance criteria, required commands, and worktree path. The worker must stop if it needs to cross its file boundary. It may not commit, push, merge, rebase, deploy, or change another worktree.

When a worker finishes, capture its diff, status, tests, and unresolved findings as task evidence. Claude checks the actual artifacts before advancing the task to verification.

## Integration

Integrate in dependency order. Prefer applying reviewed diffs or commits only after explicit Git authorization. Re-run affected focused tests after each integration and the broader suite after all tasks converge. Mark the feature complete only after integrated acceptance passes.

Do not automatically delete worktrees. Report their paths and branches at handoff and request separate approval for cleanup.


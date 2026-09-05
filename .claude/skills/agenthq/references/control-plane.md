# AgentHQ control-plane runtime

Use the `agenthq_*` MCP tools as the source of truth for run planning and status. Claude remains responsible for product judgment and acceptance; the control plane enforces deterministic mechanics.

## Start or resume

1. Use `agenthq_capabilities` to select workers for each task from declared requirements. Never claim a capability exists merely because a prompt names it.
2. Call `agenthq_run_create` after the canonical specification and feature/task plan are ready. Use `execution_profile: "auto"`, stable IDs, explicit dependencies, modes, risks, verification tiers, time budgets, and write scopes.
3. If a run already exists, call `agenthq_run_status` and use the resume popup from the run-state reference. Do not replace it without explicit user approval.
4. Render the returned feature summary and execution waves. Persistent runtime state, not chat history, is authoritative for mechanics.

## Execute

- Move tasks only through `agenthq_task_update`. A task cannot become `complete` without concrete acceptance evidence.
- Execute a wave only when every dependency is complete and every task is ready.
- Read/analysis tasks may run concurrently up to three workers.
- Write tasks may run concurrently up to two workers only when their declared file scopes do not overlap and each has an isolated worktree.
- Use `agenthq_worktrees` only in the `full` profile. Call it first with `create: false` to display the plan. Obtain popup approval, then call it with `create: true` and `confirm_create: true`.
- Assign one integrator after parallel writes. Inspect each diff, run relevant tests, and reconcile contracts before any next wave.
- Never use parallelism to hide product decisions, architecture contracts, failed tests, or blockers.

## Safety boundary

The runtime may create run-state files and explicitly approved task worktrees. It never commits, pushes, merges, deletes worktrees, opens pull requests, deploys, changes production data, or approves its own output. Those remain separate user gates.

---
name: agenthq
description: Coordinate an approved design through Codex review, bounded implementation, and verification in a selected Git repository.
argument-hint: "[project-name or /absolute/repo/path] [implementation request or constraints]"
disable-model-invocation: true
---

# AgentHQ: Claude leads, Codex engineers

Act as the project/program manager and technical lead. Use the `codex-bridge` MCP tools as an independent design reviewer and implementation engineer. Carry the design and decisions already established in this conversation into the target repository. Invocation details:

`$ARGUMENTS`

Use ultrathink when reconciling the design, Codex findings, and repository constraints. Do not make the user manually relay routine questions between Claude and Codex.

Read [references/run-state.md](references/run-state.md) and [references/control-plane.md](references/control-plane.md) at the start of every invocation and follow their persistence, routing, and visible-status contracts. After establishing the canonical specification, read [references/feature-planning.md](references/feature-planning.md) and [references/efficient-execution.md](references/efficient-execution.md), divide the product into outcome-based features and bounded tasks, assign time budgets and verification tiers, and show the feature dashboard before execution. Read [references/worktree-parallelism.md](references/worktree-parallelism.md) before any parallel write wave and [references/behavioral-evaluations.md](references/behavioral-evaluations.md) when planning verification. For any website or web application, also read [references/website-delivery.md](references/website-delivery.md), [references/quality-gates.md](references/quality-gates.md), and [references/visual-regression.md](references/visual-regression.md); read [references/content-seo.md](references/content-seo.md) for public/indexable pages; and read [references/local-preview.md](references/local-preview.md) before runtime verification and handoff. Load conditional references only when applicable.

## Blocking questions must use the question popup

Whenever progress requires a user choice or approval, use Claude Code's `AskUserQuestion` tool so the user receives a visible interactive popup. Do not bury a blocking question in progress prose or end a normal status message with a question and then silently wait.

- Ask one focused decision at a time unless two decisions are inseparable.
- Use a short header and plain-language question. State why the workflow is blocked.
- Provide two to four mutually exclusive choices, put the recommended choice first, label it `(Recommended)`, and describe the consequence of each choice.
- Use the popup for repository selection, clone approval, conflicting base branches, dirty-tree conflicts, product or business ambiguity, destructive actions, credentials, security/privacy posture, paid services, scope expansion, Git publication, and deployment decisions.
- Do not use a popup for routine progress updates or technical questions Claude can resolve from the repository, specification, tests, or Codex review.
- After invoking the popup, stop mutating work until the user answers. Once answered, restate the selected choice briefly and continue automatically.
- If `AskUserQuestion` is unavailable, print `ACTION REQUIRED` on its own line, give numbered choices with the recommended choice first, and explicitly say `Waiting for your answer.`

## Installation defaults

- GitHub owner: `sandeepchinamanagonda`
- GitHub repository base: `https://github.com/sandeepchinamanagonda`
- Local projects root: `/Users/sande/Desktop/Projects`

A short project name is an alias only when a matching directory exists under the local projects root or a matching repository exists under the configured GitHub owner. Do not mistake request words such as `implement` or `review` for aliases. Never silently accept a same-named directory whose `origin` belongs to another owner.

If a GitHub repository exists but is not cloned locally, show the proposed destination and obtain approval through the question popup before cloning. If neither exists, use the question popup to ask whether it is a new project; do not create a directory, repository, initial commit, or remote without explicit approval.

After resolving the canonical Git root, run `~/.claude/skills/agenthq/scripts/install-project-skill.sh <absolute-git-root>` before planning or implementation. This installs or refreshes the managed project-local copy at `.claude/skills/agenthq`, so future Claude sessions in that repository discover `/agenthq` without depending only on personal-skill discovery. Report the one-line bootstrap result in the first status update. A pre-existing project-local AgentHQ skill without the `.agenthq-managed` marker is project-owned customization: preserve it, report `custom-preserved`, and continue with the currently loaded global skill. Never overwrite it automatically.

## 1. Select and protect the target

1. Select the repository in this order:
   - A valid project alias in the invocation arguments.
   - An absolute repository path in the invocation arguments.
   - The current Git repository when its `origin` belongs to `sandeepchinamanagonda`.
   - Otherwise ask for the project alias or absolute path; this may be a design-only workspace.
2. Resolve one canonical absolute Git root with at least one commit. Pass it explicitly as `repo_dir` on every bridge call; never rely on the MCP default directory.
3. Install or refresh the managed project-local AgentHQ skill using the bootstrap command above. This isolated `.claude/skills/agenthq` write does not authorize any other repository mutation.
4. Require the `origin` remote to match `sandeepchinamanagonda`. Stop and show any unexpected or missing remote.
5. If the target is outside Claude's current access roots, request access or tell the user to run `/add-dir <absolute-path>`.
6. Inspect branch, status, and diff before mutation. Preserve all pre-existing work. Never stash, overwrite, revert, delete, commit, push, merge, or deploy it without explicit authorization.
7. When the tree is clean and the current branch is `main` or `master`, create a task branch named `agenthq/<feature-slug>` before implementation. If the tree is dirty or that branch already exists, explain the state and avoid an automatic switch.
8. Confirm `codex-bridge` is connected. If not, ask the user to restart Claude Code after installation; do not silently replace it with a direct Codex shell command.

## 2. Establish the contract

Choose or derive a short feature slug. Create or update `specs/<feature-slug>.md`; use another explicit spec path only when the user identified it. Merge relevant existing content rather than discarding it.

The spec is the contract for both agents and must define:

- Outcome, users, scope, and non-goals.
- Existing behavior and repository constraints.
- Architecture, interfaces, schemas, and state transitions.
- Allowed implementation areas and prohibited changes.
- Error, timeout, concurrency, security, and privacy behavior.
- Compatibility, migration, rollout, and rollback expectations.
- Test plan and objective acceptance criteria.

For a website, the contract must additionally cover the UX/design system, responsive and accessibility behavior, frontend/backend boundaries, data/API/system design, runtime verification, and a cost envelope. Follow the website delivery reference instead of treating the provided spec as automatically complete.

Resolve technical ambiguity from the conversation, repository, tests, and established conventions. Ask the user only when an answer changes product behavior, business rules, destructive data handling, external cost, credentials, privacy, or security posture.

## 3. Build the feature execution graph

Before design review or implementation, divide the approved contract into product features and each feature into dependency-aware tasks using the feature-planning reference. Use `agenthq_capabilities` to select real capabilities for each task, then use `agenthq_run_create` with `execution_profile: "auto"` to choose the lightest suitable profile and persist the graph. Show the selected profile, proposed features, parallel/sequential decisions, and per-feature status; omit internal routing detail unless it explains a risk or blocker. Do not begin implementation until every required task is either `ready`, dependency-blocked with a clear owner, or awaiting a user decision through the question popup.

## 4. Bounded design review

1. Call `codex_review` with the explicit `repo_dir` and selected `spec_file`.
2. Treat findings as independent engineering review, not automatic truth. Check each against product intent and the codebase.
3. Resolve valid technical findings yourself and revise the spec. Briefly record why any blocking or major finding is rejected.
4. Run at most three review rounds. Begin implementation only when no valid blocking finding remains and all valid major findings are either resolved or explicitly accepted as risk.
5. After three rounds, stop and present unresolved decisions. Do not loop until Codex is merely satisfied with wording.

## 5. Bounded implementation

1. Split the approved contract into no more than five dependency-ordered, reviewable chunks. Ask before expanding that limit.
2. For each chunk, call `codex_implement` with the exact `repo_dir`, selected `spec_file`, a concrete task, and `sandbox: "workspace-write"`.
3. Never request `danger-full-access` unless the user explicitly authorizes the specific need and the bridge installation permits it.
4. Inspect the returned status and diff. Claude owns acceptance: confirm scope, behavior, security, compatibility, and project conventions instead of trusting the summary.
5. Run the smallest relevant tests after each chunk and broader checks at the end. Do not weaken or delete tests to obtain a pass.
6. Allow at most two repair attempts per chunk. Then stop with the evidence and unresolved failure.
7. Use `codex_diff` whenever state is uncertain. Use `codex_revert` only after showing exact affected paths, receiving explicit approval, and passing `confirm_discard: true`.
8. Use `agenthq_task_update` for every lifecycle transition and evidence record. For an eligible parallel write wave, follow the worktree reference and use `agenthq_worktrees`; never run concurrent writers in one working tree.
9. Use focused verification after each task, feature verification after integration waves, and the full required suite before handoff. Do not repeatedly run the full suite when the efficient-execution reference calls for focused evidence.
10. At the task time budget, checkpoint instead of continuing invisibly. Continue when concrete progress is healthy; pause and split or request an extension only when progress is stalled, evidence is absent, or scope expanded.

Stop implementation immediately when:

- A change escapes the spec's allowed areas or requires architectural scope expansion.
- Pre-existing work overlaps files the task must change.
- A database migration, authentication/authorization change, destructive data operation, paid service, secret/credential operation, major dependency replacement, or deployment/infrastructure mutation lacks explicit approval.
- Tests reveal an unrelated repository failure that cannot be separated safely.

## 6. Verify, preview, and hand off

Finish only when acceptance criteria are satisfied, relevant tests pass, and the final diff has no unexplained changes. Report:

- Repository and branch.
- Spec path and review rounds.
- Implemented chunks and files changed.
- Feature/task dashboard with terminal status and acceptance evidence for every item.
- Tests/checks and results.
- Runtime, UI/accessibility, security, and cost evidence when applicable.
- For a website, a healthy user-accessible local preview with URLs and visual-approval result, or an explicit preview blocker with evidence.
- Accepted risks and manual follow-up.
- Exact uncommitted status.

Leave changes uncommitted and unpushed unless the user explicitly requests the next Git action.

# AgentHQ behavioral evaluations

Run the bundled bridge test suite after changing AgentHQ itself. For a product run, translate the canonical specification's highest-risk behaviors into acceptance evaluations before implementation.

Behavioral evaluations must check observable outcomes rather than exact agent wording. At minimum, preserve these AgentHQ invariants:

- Invalid or cyclic task graphs are rejected.
- Parallel writes with overlapping file scopes are never placed in the same wave.
- More than one concurrent write task requires worktrees.
- Existing run state is not silently replaced.
- Task completion requires acceptance evidence.
- Blocking states name the blocker and owner.
- Git publication, deployment, destructive actions, paid services, secrets, and material product decisions remain user gates.
- A website cannot complete without runtime, responsive/accessibility, visual, content/SEO when applicable, and final-diff evidence.
- Ordinary task completion uses focused checks; feature integration uses feature checks; the full suite remains mandatory at final handoff.
- Tasks reaching their time budget create a recoverable checkpoint instead of continuing invisibly or discarding work.
- Auto profile selection chooses `fast` for small low-risk work, `standard` for ordinary features, and `full` only for large or high-risk work.
- An over-budget task with healthy progress may continue; a stalled or unevidenced task pauses for splitting or extension.

Use fixtures for common project types and failure paths. Report the evaluated behavior, result, and evidence; do not treat a model response that merely says “done” as a pass.

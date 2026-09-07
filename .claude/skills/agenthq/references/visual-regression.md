# Visual regression workflow

Use this reference for every changed user interface after the local preview is healthy.

## Deterministic captures

- Use the repository's existing visual-test framework when available. Prefer Playwright screenshots when adding a lightweight baseline to a web project.
- Capture approved routes and component states at 375, 768, 1024, and 1440 pixel widths, plus any repository-specific viewport.
- Fix locale, timezone, fonts, color scheme, motion preference, sample data, viewport, and authentication state.
- Wait for fonts, stable network state, and intentional animations. Mask only genuinely nondeterministic values such as timestamps or rotating IDs; never mask broken product content.
- Store baselines in the repository's established snapshot location. Do not overwrite an existing baseline merely to make a test pass.

## Compare and classify

Run automated screenshot comparison when the project supports it, then inspect every diff. Classify each result as:

- `pass`: no meaningful change.
- `intentional`: matches the approved design and needs baseline approval.
- `regression`: unintended layout, content, state, accessibility, or responsive change.
- `blocked`: capture is nondeterministic or the environment cannot reproduce the baseline.

Thresholds must be explicit and as strict as the existing repository allows. A threshold is not permission to ignore visible clipping, overlap, missing controls, color/contrast changes, or mobile breakage.

## Approval gate

Show representative before/after/diff evidence and use `AskUserQuestion` before accepting new baselines when the appearance changes materially. The recommended option should preserve the current approved baseline unless the new design was already approved.

Record routes, states, viewports, comparator command, result counts, approved baseline changes, and residual limitations in task evidence and the final quality table.


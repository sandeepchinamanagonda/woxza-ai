# Website quality gates

Use the smallest applicable checks, but do not claim a gate passed without evidence. Prefer repository-defined commands over inventing new tooling.

## Required for changed behavior

1. **Static:** formatting, lint, type checking, compilation/build, and generated-file consistency when present.
2. **Behavior:** focused unit and integration tests mapped to acceptance criteria, including important error and permission paths.
3. **Runtime:** start the relevant services and exercise the changed journey through its real interface.
4. **Regression:** run the broader existing suite appropriate to the change before handoff.
5. **Diff:** inspect all changed and untracked files; explain every change and confirm no credentials, generated noise, or unrelated edits.

## Additional gates for user interfaces

- Capture or inspect the relevant pages at 375, 768, 1024, and 1440 pixel widths.
- Confirm no unintended horizontal overflow, clipped controls, overlapping content, or layout instability.
- Exercise keyboard-only navigation and visible focus; check semantic labels and important contrast.
- Verify loading, empty, error, success, disabled, validation, long-content, and permission states that the feature can reach.
- Check browser console errors and failed network requests.
- Measure performance when the change can affect startup, rendering, large assets, queries, or bundles; compare against the repository's baseline rather than guessing.
- Complete the local-preview and visual-approval workflow in [local-preview.md](local-preview.md).
- Complete [visual-regression.md](visual-regression.md) for changed interfaces and [content-seo.md](content-seo.md) for public/indexable pages.

## Security and cost triggers

Run focused threat/security review for authentication, authorization, user input, uploads, secrets, sensitive data, third-party integrations, and public endpoints. Verify server-side enforcement rather than trusting UI restrictions.

Review query counts, external calls, storage growth, data transfer, retry loops, and unbounded jobs when they can affect recurring cost. A new paid service or materially higher cost requires a popup decision.

## Evidence table

Maintain this compact table in the final report:

| Gate | Command or observation | Result | Evidence/follow-up |
|---|---|---|---|
| Static | | | |
| Behavior | | | |
| Runtime | | | |
| UI/accessibility | | | |
| Security | | | |
| Cost | | | |
| Final diff | | | |

Use `not applicable` only with a short reason. Use `not run` when a required environment or credential is unavailable; never convert that into a pass.

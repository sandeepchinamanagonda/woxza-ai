# Local preview and visual approval

Read this reference for every website or web-application run before final handoff. A website is not complete until the user can open a working local preview, or AgentHQ reports an explicit preview blocker with evidence.

## Prepare safely

- Discover repository-defined install, database, seed, backend, frontend, and combined development commands. Prefer lockfile-preserving installs and existing scripts.
- Use existing example environment files. Create only local development configuration; never copy, print, or invent production secrets.
- Use mock, sandbox, or locally captured integrations for payments, email, SMS, storage, analytics, and webhooks.
- Never reset, replace, or seed over an existing non-test database. Seed only a clearly identified disposable local database, and make seed operations repeatable.
- Detect occupied ports and active project processes before starting anything. Reuse a healthy matching service or select safe alternate ports; do not kill unrelated processes.
- Do not open a tunnel, public URL, cloud preview, purchase, deployment, or externally reachable service without explicit approval.

## Start and prove the stack

1. Install missing project dependencies using the repository's package manager.
2. Start required local infrastructure, database, backend, jobs, and frontend in dependency order.
3. Record process/session identifiers, ports, log locations, and stop commands in run state.
4. Wait for explicit health or readiness evidence; a listening port alone is not sufficient when a health or functional check exists.
5. Load representative sample data needed for the approved journeys.
6. Exercise one real end-to-end path through the public interface before presenting the preview.

If a service fails, capture the smallest useful error, allow the bounded repair policy, and report `blocked` rather than claiming the preview is available.

## Browser and viewport review

- Open the primary local customer URL in an available browser tool and provide the clickable URL to the user.
- Exercise the feature journeys and states required by the canonical specification and feature plan.
- Inspect console errors, failed requests, redirects, authentication/authorization behavior, and visible validation.
- Review relevant pages at 375, 768, 1024, and 1440 pixel widths. Capture representative screenshots or equivalent visual evidence.
- Check keyboard access, visible focus, labels, important contrast, reduced motion, loading, empty, error, success, long-content, and permission states.
- For administrative interfaces, provide a separate local URL and test credentials only when they are disposable local credentials created for this preview.

## Preview status

Display:

```text
AgentHQ local preview
Customer URL: <clickable local URL or not applicable>
Admin URL: <clickable local URL or not applicable>
API/health: <URL and status>
Database: <healthy / not required / blocked>
Sample data: <loaded / not required / blocked>
Journeys: <passed>/<required>
Responsive views: <passed>/<required>
Accessibility checks: <passed>/<required>
Console/network: <clean, findings, or blocked>
Servers: <running or stopped>
Waiting on you: visual approval
```

Do not show credentials, tokens, connection strings, or sensitive logs in this card.

## User feedback gate

After presenting a healthy preview, invoke `AskUserQuestion` with:

1. `Approve local version (Recommended)` — continue to final verification and handoff.
2. `Request design changes` — collect focused visual feedback and create or update affected feature tasks.
3. `Request functional changes` — capture the behavior change, assess scope/dependencies, and request approval if it expands the contract.
4. `Prepare deployment plan` — produce a costed plan only; do not deploy.

After the answer, briefly restate the selected direction and continue automatically. If the popup tool is unavailable, use the `ACTION REQUIRED` fallback from the main skill.

## Server lifecycle

- Keep healthy local servers running while waiting for visual approval unless that creates a resource or safety problem.
- On completion or at the user's request, offer to stop only the recorded AgentHQ-started processes and containers.
- Verify shutdown when requested and preserve the commands needed to start the preview again.

## Handoff rule

The final report includes local URLs, start/stop commands, environment prerequisites, sample-data behavior, browser evidence, known preview limitations, and whether servers remain running. Never equate local approval with authorization to commit, push, create a PR, expose a public preview, or deploy.

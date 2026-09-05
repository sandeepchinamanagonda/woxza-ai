# Website delivery profile

Read this reference for any website, web application, dashboard, portal, landing page, or full-stack web task.

## Outcome

Turn the approved specification into a coherent product across UX, frontend, backend, data, security, operations, and cost. Prefer a small maintainable system over speculative scale or infrastructure.

## Phase gates

### 1. Product and repository grounding

- Verify the actual base branch, current behavior, stack, package manager, build/test commands, deployment files, and existing design/system documents.
- Treat existing code and tests as evidence. If the specification depends on code absent from the requested base, use the question popup before branching.
- Convert vague outcomes into observable acceptance criteria. Preserve explicit non-goals.

### 2. UX and visual contract

For user-facing work, invoke the installed `ui-ux-pro-max` skill and use its search/design-system tooling before implementation. Reuse an existing approved design system; do not replace it merely because another style is available.

Record or update a design-system artifact that covers:

- User journeys, information architecture, page inventory, and navigation.
- Responsive behavior and layouts for 375, 768, 1024, and 1440 pixel viewports.
- Design tokens: color, typography, spacing, radius, elevation, motion, and iconography.
- Components and their default, hover, focus, active, disabled, loading, empty, error, success, and permission-denied states.
- Keyboard navigation, semantic structure, labels, focus visibility, reduced motion, and WCAG AA contrast.
- Realistic content behavior, including long text, missing media, and constrained screens.

Do not let the design skill silently change product behavior, brand direction, or an already approved visual design. Those require a popup decision.

For public/indexable pages, follow [content-seo.md](content-seo.md) while defining the page inventory and content contract.

### 3. System and backend contract

The specification must identify:

- System boundaries and a short architecture/data-flow diagram.
- Frontend/backend responsibilities and stable interfaces.
- Data model, ownership, constraints, migrations, retention, and recovery.
- API inputs, outputs, validation, authorization, idempotency, pagination, errors, timeouts, and compatibility.
- Authentication and authorization trust boundaries, secrets, privacy, abuse controls, and audit needs.
- Background work, concurrency, retries, cancellation, and failure recovery only where needed.
- Observability proportional to risk: structured errors/logs and a small set of actionable health signals.
- Deployment, rollback, and migration sequence without performing deployment.

Prefer an existing modular monolith and current database. Add services, queues, caches, search engines, or new data stores only when a measured requirement justifies their operational cost.

### 4. Cost contract

Include a `Cost envelope` section in the specification:

- Expected users, traffic, storage, data transfer, and background workload, or mark them unknown with a measurement plan.
- Target monthly infrastructure budget. If none was supplied, optimize for the lowest practical recurring cost and ask only before introducing a paid service.
- Reuse existing infrastructure and free/local tooling when it remains secure and maintainable.
- List every new recurring-cost dependency with its purpose, free-tier/starting cost, scale trigger, and cheaper fallback.
- Add budgets, quotas, caching, retention, rate limits, or alerts where unbounded usage could create surprise cost.

Do not trade away correctness, security, accessibility, backups, or maintainability merely to minimize cost.

### 5. Independent review and implementation

- Have Codex review the combined product, UX, system, test, and cost contract before implementation.
- Implement thin vertical slices that connect UI, API, data, and tests for one behavior at a time.
- Preserve existing architecture unless the approved specification explicitly changes it.
- Keep dependencies minimal and use the repository's established libraries first.

### 6. Runtime verification and local preview

Follow [quality-gates.md](quality-gates.md), [visual-regression.md](visual-regression.md), and [local-preview.md](local-preview.md). A website is not complete based only on static review or a passing unit test suite. Present a healthy local customer preview, relevant administration preview, representative sample data, browser and regression evidence, and a visual-approval popup before final handoff.

## Handoff

Report the implemented user journeys, system design, cost assumptions, evidence from each quality gate, remaining operational steps, and uncommitted Git state. Never imply that deployment occurred unless it was separately authorized and verified.

# Semantic route calibration gate

Phase 4 turns reviewed shadow decisions into an activation recommendation. It
does not enable a caller-facing route or alter a catalog automatically.

For each route, label the persisted evaluation record with the action a human
reviewer expected. The calibration endpoint then evaluates candidate score,
negative-margin, and competing-margin thresholds from that evidence.

The recommendation is eligible for controlled activation only when each risky
action (`grant_permission` and `close_declined`) has at least 30 reviewed
examples, no false positives, and at least 0.90 recall. Otherwise the route
remains in shadow and the reviewer should improve examples or collect more
labels.

Use the route-specific report:

`GET /api/admin/semantic-route-calibration?route_id=opening_permission`

The response includes the recommended thresholds, their evidence source,
confusion matrix, action-level precision and recall, and the next safe action.
Threshold recommendations are review artifacts; Phase 5 applies an approved
configuration behind a reversible route flag.

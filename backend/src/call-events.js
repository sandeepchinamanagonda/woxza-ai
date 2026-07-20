import { randomUUID } from "node:crypto";

const DEFAULT_ORG_ID = "woxza";
const deployVersion = () => process.env.DEPLOY_VERSION || process.env.GIT_SHA || "local";
const instanceId = () => process.env.INSTANCE_ID || process.env.HOSTNAME || "local";
const SENSITIVE_KEYS = new Set([
  "phone", "phone_number", "phoneNumber", "from", "to", "name", "customer_name", "customerName", "email"
]);

export function maskPhoneNumber(phone) {
  const value = String(phone || "");
  return value.length <= 4 ? "••••" : `••••${value.slice(-4)}`;
}

// Do not turn the debug database into a second source of customer PII. Keep
// the diagnostic shape (error, request/response, tool args) but replace known
// identity fields wherever they occur, including inside provider payloads.
export function redactCallPayload(value, key = "") {
  if (SENSITIVE_KEYS.has(key)) return key.toLowerCase().includes("phone") || key === "from" || key === "to" ? maskPhoneNumber(value) : "[redacted]";
  if (Array.isArray(value)) return value.map(item => redactCallPayload(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redactCallPayload(childValue, childKey)]));
  return value;
}

// Dashboard instrumentation audit (2026-07-20): Gemini transport errors and
// reconnects, transcript persistence errors, Plivo/Twilio lifecycle events,
// and provider-call failures are wired below their originating paths. Gemini
// tool invocations and first outbound audio are logged in gemini-bridge.js.
// Redis is currently only used for the BullMQ connection and health PING; no
// application GET/SET lookup exists to instrument. Add redis_lookup at the
// call site if that changes. Database query failures are logged at the known
// transcript persistence path; do not copy transcript text into call_events.

// This intentionally never awaits in a live call path. Dashboard telemetry is
// best-effort: a database problem must not affect a caller's conversation.
export function logCallEvent(db, {
  callId,
  demoCallId = null,
  orgId = DEFAULT_ORG_ID,
  eventType,
  severity = "info",
  payload = {},
  latencyMs = null,
  traceId = callId,
  call = null
}) {
  if (!db?.query || !callId || !eventType) return;
  const event = {
    id: randomUUID(), callId:String(callId), demoCallId, orgId, eventType, severity,
    payload:redactCallPayload(payload), latencyMs:Number.isFinite(latencyMs) ? Math.round(latencyMs) : null,
    traceId, deployVersion:deployVersion(), instanceId:instanceId()
  };
  void db.query(
    `INSERT INTO call_events
      (id,call_id,demo_call_id,org_id,event_type,severity,payload,latency_ms,trace_id,deploy_version,instance_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)`,
    [event.id,event.callId,event.demoCallId,event.orgId,event.eventType,event.severity,
      JSON.stringify(event.payload || {}),event.latencyMs,event.traceId,event.deployVersion,event.instanceId]
  ).then(async () => {
    if (eventType === "call_started") {
      await db.query(
        `INSERT INTO calls (call_id,demo_call_id,org_id,phone_number_masked,provider,status,started_at,agent_id,trace_id,deploy_version,instance_id)
         VALUES ($1,$2,$3,$4,$5,'in_progress',NOW(),$6,$7,$8,$9)
         ON CONFLICT (call_id) DO UPDATE SET demo_call_id=EXCLUDED.demo_call_id, status='in_progress', trace_id=EXCLUDED.trace_id, deploy_version=EXCLUDED.deploy_version, instance_id=EXCLUDED.instance_id`,
        [event.callId,event.demoCallId,event.orgId,call?.phoneNumberMasked || null,call?.provider || "unknown",call?.agentId || null,event.traceId,event.deployVersion,event.instanceId]
      );
    } else if (eventType === "call_ended") {
      await db.query(
        `UPDATE calls SET status=$2,ended_at=COALESCE(ended_at,NOW()),total_latency_ms=COALESCE($3,total_latency_ms),deploy_version=$4,instance_id=$5 WHERE call_id=$1`,
        [event.callId, event.payload.status === "failed" ? "failed" : "completed", event.latencyMs, event.deployVersion, event.instanceId]
      );
    } else if (eventType === "turn_end") {
      await db.query("UPDATE calls SET turn_count=turn_count+1 WHERE call_id=$1", [event.callId]);
    } else if (severity === "error") {
      // An error event is diagnostic, not a terminal provider outcome. The
      // lifecycle owner records completed/failed through call_ended instead.
      await db.query("UPDATE calls SET error_count=error_count+1 WHERE call_id=$1", [event.callId]);
    }
  }).catch(error => console.warn("Call event persistence failed", { callId:event.callId, eventType, error:error.message }));
}

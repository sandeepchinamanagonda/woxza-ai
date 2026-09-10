import test from "node:test"
import assert from "node:assert/strict"
import { voicePipelineMetrics } from "../src/admin-debug.js"

test("voice pipeline metrics returns latency targets, request counts, and validation decisions", async () => {
  const responses = [
    { rows:[{ calls:4, completed_calls:3, failed_calls:1, calls_with_errors:1 }] },
    { rows:[{ event_type:"llm_first_token", requests:4, measured_requests:4, p50_ms:820, p95_ms:1420, max_ms:1600 }] },
    { rows:[{ decision:"complete", requests:3 }, { decision:"incomplete", requests:1 }] },
    { rows:[{ event_type:"error", severity:"error", requests:1 }] }
  ]
  const db = { query:async () => responses.shift() }
  const metrics = await voicePipelineMetrics(db, new URL("https://example.test/api/admin/voice-pipeline-metrics?hours=9999"))
  assert.equal(metrics.window_hours, 720)
  assert.equal(metrics.calls.calls, 4)
  assert.equal(metrics.latency.find(row => row.event_type === "llm_first_token").status, "within_target")
  assert.equal(metrics.latency.find(row => row.event_type === "first_audio_sent").status, "no_data")
  assert.equal(metrics.turn_validation_decisions[0].decision, "complete")
})

import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTags, resolveFeatureContext } from "../src/features.js";

test("normalizes editable feature tags without imposing an enum", () => {
  assert.deepEqual(normalizeTags([" Pharmacy ", "pharmacy", "New Industry", ""]), ["pharmacy", "new industry"]);
});

test("falls back to general features when a classified tag has no active features", async () => {
  const calls = [];
  const db = { query:async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes("ARRAY[$1]::text[]") && values[0] === "insurance") return { rows:[] };
    if (sql.includes("ARRAY['general']")) return { rows:[{ id:"general-1", title:"Phone agent", description:"Answers calls", business_tags:["general"], priority:1, status:"live" }] };
    return { rows:[] };
  } };
  const context = await resolveFeatureContext(db, { businessTagCandidate:"insurance", limit:4 });
  assert.equal(context.businessTag, "general");
  assert.equal(context.usedGeneralFallback, true);
  assert.equal(context.features[0].id, "general-1");
  assert.ok(calls.some(call => call.sql.includes("ARRAY['general']")));
});

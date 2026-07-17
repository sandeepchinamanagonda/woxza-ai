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

test("excludes features already mentioned when resolving a follow-up", async () => {
  const calls = [];
  const db = { query:async (sql, values) => {
    calls.push({ sql, values });
    if (sql.includes("ARRAY[$1]::text[]")) return { rows:[{ id:"new-feature", title:"New feature", description:"New value", business_tags:["retail"], priority:2, status:"live" }] };
    return { rows:[] };
  } };
  const context = await resolveFeatureContext(db, { businessTagCandidate:"retail", excludeFeatureIds:["old-feature"], limit:3 });
  assert.equal(context.features[0].id, "new-feature");
  assert.deepEqual(calls[0].values, ["retail", ["old-feature"], 3]);
  assert.match(calls[0].sql, /NOT \(id = ANY\(\$2::uuid\[\]\)\)/);
});

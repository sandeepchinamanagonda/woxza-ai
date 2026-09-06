import test from "node:test"
import assert from "node:assert/strict"
import { normalizeCapabilityCatalog } from "../src/demo/capability-catalog.js"
import { approvedCapabilities } from "../src/demo/capability-retriever.js"

const catalog = normalizeCapabilityCatalog({ capabilities:[
  { id:"follow_up", title:"Follow-up", callerSafeClaim:"Can be configured for follow-up.", availability:"configurable", requirements:["workflow"], demoMode:"fictional_example_only", reviewStatus:"approved", matches:{ businessTerms:["steel shop"], workflowTerms:["update"], painTerms:["reply"] } },
  { id:"crm", title:"CRM", callerSafeClaim:"Can work with a connected CRM.", availability:"configurable", requirements:["connection"], demoMode:"fictional_example_only", reviewStatus:"approved", matches:{ businessTerms:["clinic"], workflowTerms:["crm"], painTerms:["manual entry"] } },
  { id:"unsafe", title:"Unsafe", callerSafeClaim:"Never select me.", availability:"roadmap", requirements:[], demoMode:"fictional_example_only", reviewStatus:"approved", matches:{ businessTerms:["steel shop"], workflowTerms:[], painTerms:[] } }
] })

test("returns only approved caller-safe records selected by the semantic interpreter", () => {
  const selected = approvedCapabilities({ catalog, candidateIds:["follow_up", "unsafe", "missing"] })
  assert.deepEqual(selected.map(item => item.id), ["follow_up"])
  assert.equal(selected[0].availability, "configurable")
  assert.deepEqual(selected[0].requirements, ["workflow"])
})

test("caps a prepared pitch at five grounded capability records", () => {
  const pitchCatalog = normalizeCapabilityCatalog({ capabilities:Array.from({ length:6 }, (_, index) => ({
    id:`capability_${index}`, title:`Capability ${index}`, callerSafeClaim:`Approved claim ${index}.`, callerImpact:`Approved impact ${index}.`,
    availability:"configurable", requirements:["configured workflow"], demoMode:"fictional_example_only", reviewStatus:"approved",
    matches:{ businessTerms:["clinic"], workflowTerms:[], painTerms:[] }
  })) })
  const selected = approvedCapabilities({ catalog:pitchCatalog, candidateIds:Array.from({ length:6 }, (_, index) => `capability_${index}`), limit:5 })
  assert.equal(selected.length, 5)
  assert.ok(selected.every(item => item.impact.startsWith("Approved impact")))
})

test("preserves interpreter order and rejects unsupported IDs", () => {
  assert.deepEqual(approvedCapabilities({ catalog, candidateIds:["missing", "crm", "follow_up", "crm"] }).map(item => item.id), ["crm", "follow_up"])
})

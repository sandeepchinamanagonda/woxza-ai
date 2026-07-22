import assert from "node:assert/strict"
import test from "node:test"
import { selectPitchPoints } from "../src/demo/pitch-selector.js"

test("dynamic workflow tags choose relevant capabilities without matching business terminology", () => {
  const library = {
    broad:{ claim:"Works across industries", review_status:"approved", applicable_verticals:["universal"], applicable_pain:["none"], tags:["flexibility"] },
    stock:{ claim:"Handles stock-aware orders", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["manual_data_entry"], tags:["inventory", "orders"] },
    discounts:{ claim:"Applies configured discounts", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["manual_data_entry"], tags:["pricing", "discounts"] }
  }
  const ids = selectPitchPoints({ vertical:"retail_general", workflowTags:["inventory_orders", "pricing_discounts"] }, library).map(point => point.id)
  assert.deepEqual(ids, ["stock", "discounts"])
})

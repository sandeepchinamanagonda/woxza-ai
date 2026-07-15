import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import { createDatabase } from "../src/database.js"
import { USE_CASE_CONFIG } from "../src/demo/prompt.js"

test("realigned demo_calls constraint accepts every configured use case", { skip:!process.env.DATABASE_URL }, async () => {
  const db = await createDatabase({ connectionString:process.env.DATABASE_URL, retries:1 })
  try {
    for (const useCase of Object.keys(USE_CASE_CONFIG)) {
      await assert.doesNotReject(() => db.query(
        "INSERT INTO demo_calls (id,use_case,name,phone,ip,consent_marketing,status) VALUES ($1,$2,'Test caller',$3,'127.0.0.1',FALSE,'initiating')",
        [randomUUID(), useCase, `+1555${Math.floor(Math.random() * 10_000_000).toString().padStart(7, "0")}`]
      ))
    }
  } finally {
    await db.end()
  }
})

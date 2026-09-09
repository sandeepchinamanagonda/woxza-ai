import { createFullValueSemanticIndexService } from "../src/demo/full-value-semantic-index-service.js"

const result = await createFullValueSemanticIndexService().sync()
console.log(JSON.stringify(result, null, 2))
if (result.status !== "ready") process.exitCode = 1

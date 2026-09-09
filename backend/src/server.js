import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createDatabase } from "./database.js";
import { createDemoRuntime } from "./demo/runtime.js";
import { attachDemoGeminiBridge } from "./demo/gemini-bridge.js";
import { attachDemoV2Bridge } from "./demo/v2-bridge.js";
import { attachDemoV3StreamingBridge } from "./demo/v3-streaming-bridge.js";
import { createSemanticRouteRuntime } from "./demo/semantic-route-runtime.js";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3456")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = await createDatabase();
const demoRuntime = createDemoRuntime(db);
const semanticRouteRuntime = createSemanticRouteRuntime();
const semanticRouteRequired = String(process.env.V3_SEMANTIC_ROUTE_ROUTER || "shadow").trim().toLowerCase() === "active";
const server = createServer(createApp({ db, demoService: demoRuntime.service, debugRuntime:demoRuntime, semanticRouteRuntime, semanticRouteRequired, allowedOrigins }));
attachDemoGeminiBridge(server, { db, redis:demoRuntime.redis });
attachDemoV2Bridge(server, { db });
attachDemoV3StreamingBridge(server, { db });

server.listen(port, () => {
  console.log(`Woxza lead API listening on http://localhost:${port}`);
  // Never delay process startup or caller handling for an embedding refresh.
  // `/ready` reports degraded status while an active route has no usable index.
  void semanticRouteRuntime.warm().then(result => console.log("Semantic route index warm-up completed", JSON.stringify(result))).catch(error => console.error("Semantic route index warm-up failed", error.message));
});

function shutdown() {
  server.close(() => {
    demoRuntime.close().finally(() => db.end()).finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

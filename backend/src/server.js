import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createDatabase } from "./database.js";
import { createDemoRuntime } from "./demo/runtime.js";
import { attachDemoGeminiBridge } from "./demo/gemini-bridge.js";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3456")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = await createDatabase();
const demoRuntime = createDemoRuntime(db);
const server = createServer(createApp({ db, demoService: demoRuntime.service, allowedOrigins }));
attachDemoGeminiBridge(server, { db });

server.listen(port, () => {
  console.log(`Voxa lead API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    demoRuntime.close().finally(() => db.end()).finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

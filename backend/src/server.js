import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createDatabase } from "./database.js";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = await createDatabase();
const server = createServer(createApp({ db, allowedOrigins }));

server.listen(port, () => {
  console.log(`Voxa lead API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

import { readFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;
const schemaUrls = [
  new URL("../migrations/001_initial.sql", import.meta.url),
  new URL("../migrations/002_demo_calls.sql", import.meta.url),
  new URL("../migrations/003_demo_call_v2.sql", import.meta.url),
  new URL("../migrations/006_use_case_realign.sql", import.meta.url)
];

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function createDatabase({
  connectionString = process.env.DATABASE_URL,
  retries = Number(process.env.DB_CONNECT_RETRIES ?? 20)
} = {}) {
  if (!connectionString && !process.env.PGHOST) {
    throw new Error("DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE is required");
  }

  const connection = connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD
      };

  const pool = new Pool({
    ...connection,
    max: Number(process.env.DB_POOL_SIZE ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      for (const schemaUrl of schemaUrls) {
        const schema = await readFile(schemaUrl, "utf8");
        await pool.query(schema);
      }
      return pool;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await pause(Math.min(attempt * 500, 5_000));
    }
  }

  await pool.end();
  throw new Error(`Unable to connect to PostgreSQL: ${lastError?.message ?? "unknown error"}`);
}

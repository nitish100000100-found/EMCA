import { Pool } from "pg";
import dns from "node:dns";

// Prefer IPv4 when resolving database hostname
if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  dns.setDefaultResultOrder("ipv4first");
}

const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.NEON_DB_URL,
    connectionTimeoutMillis: 15000,
  });

global.pgPool = pool;

export default pool;

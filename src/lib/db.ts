import { Pool } from "pg";

// Enforce IPv4 resolution first in Node.js runtime to prevent IPv6 timeouts on mobile hotspots / AWS Neon endpoints
if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dns = require("dns");
    if (dns && typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // Ignore in non-Node runtimes
  }
}

const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.NEON_DB_URL,
    connectionTimeoutMillis: 15000,
  });

global.pgPool = pool;

export default pool;

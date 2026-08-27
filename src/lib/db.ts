import { Pool } from "pg";

const pool =
  global.pgPool ||
  new Pool({
    connectionString : process.env.NEON_DB_URL,
  });

global.pgPool = pool;

export default pool;  
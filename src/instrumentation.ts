import pool from "@/lib/db";

export async function register() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ Database connection failed");

    throw new Error("Database connection failed", {
      cause: error,
    });
  }
}

/*
  instrumentation.ts server start hone par
  database connection check karta hai.
  Next.js register() function ko automatically call karta hai.
*/

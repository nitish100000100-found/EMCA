import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import pool from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    const chatsResult = await pool.query(
      `SELECT 
         c.conversation_id AS id, 
         MIN(c.chat_overview) AS name
       FROM chats c
       JOIN users u ON c.user_id = u.id
       WHERE u.email = $1 
       GROUP BY c.conversation_id
       ORDER BY MAX(c.id) DESC`,
      [payload.email],
    );

    return NextResponse.json({
      success: true,
      chats: chatsResult.rows,
    });
  } catch (error) {
    console.error("Error in /api/getallchatoverview:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

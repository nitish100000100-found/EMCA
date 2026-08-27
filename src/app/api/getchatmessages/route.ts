import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import pool from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const conversationIdParam = body.conversation_id;

    if (!conversationIdParam) {
      return NextResponse.json(
        { success: false, message: "conversation_id is required in body" },
        { status: 400 }
      );
    }

    const conversationId = parseInt(String(conversationIdParam), 10);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid conversation_id parameter" },
        { status: 400 }
      );
    }

    // Get user id from users table via email in JWT payload
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [
      payload.email,
    ]);

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userId = userRes.rows[0].id;

    // Fetch messages for this conversation ordered chronologically
    const messagesRes = await pool.query(
      `SELECT id, role, type, content, file_url, created_at 
       FROM chats 
       WHERE user_id = $1 AND conversation_id = $2 
       ORDER BY created_at ASC, id ASC`,
      [userId, conversationId]
    );

    return NextResponse.json({
      success: true,
      messages: messagesRes.rows,
    });
  } catch (error) {
    console.error("Error in POST /api/getchatmessages:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

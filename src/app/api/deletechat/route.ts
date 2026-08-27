import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import pool from "@/lib/db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [
      payload.email,
    ]);

    if (!userRes.rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRes.rows[0].id;
    const body = await req.json().catch(() => ({}));
    const conversationIdParam = body.conversation_id;

    if (!conversationIdParam) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 },
      );
    }

    const conversationId = parseInt(String(conversationIdParam), 10);
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation_id parameter" },
        { status: 400 },
      );
    }

    const deleteRes = await pool.query(
      "DELETE FROM chats WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userId],
    );

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
      deletedCount: deleteRes.rowCount,
    });
  } catch (error: unknown) {
    console.error("DELETE CHAT ERROR:", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

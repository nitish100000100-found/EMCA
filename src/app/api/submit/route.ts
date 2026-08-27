import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import pool from "@/lib/db";
import { uploadToCloudinary } from "@/lib/clodinary";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [payload.email]);
    if (!userRes.rows[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const userId = userRes.rows[0].id;

    const formData = await req.formData();
    const message = ((formData.get("message") as string) || "").trim();
    const file = formData.get("file") as File | null;
    const isFirst = formData.get("first") === "true";
    const conversationIdParam = formData.get("conversation_id");

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    let fileUrl = null;
    let type = "text";

    if (file && file.size > 0) {
      type = file.type === "application/pdf" ? "pdf" : "image";
      const uploadRes = await uploadToCloudinary(file);
      fileUrl = uploadRes.secure_url;
    }

  
    const conversationId = isFirst ? Math.floor(Date.now() / 1000) : Number(conversationIdParam);
    const overview = message.slice(0, 50);

    const query = `
      INSERT INTO chats (user_id, conversation_id, role, type, content, file_url, chat_overview)
      VALUES ($1, $2, 'user', $3, $4, $5, $6) RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      conversationId,
      type,
      message,
      fileUrl,
      overview,
    ]);

    return NextResponse.json({
      success: true,
      chat: result.rows[0],
      conversation_id: conversationId,
    });
  } catch (error: unknown) {
      console.error("SUBMIT ERROR:", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

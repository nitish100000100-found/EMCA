import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import pool from "@/lib/db";
import { uploadToCloudinary } from "@/lib/clodinary";
import { runAgent } from "@/genAi/main";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

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
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File size must be smaller than 5 MB" }, { status: 400 });
      }

      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      if (!isPdf && !isImage) {
        return NextResponse.json({ error: "Only image and PDF files are allowed" }, { status: 400 });
      }

      type = isPdf ? "pdf" : "image";
      const uploadRes = await uploadToCloudinary(file);
      fileUrl = uploadRes.secure_url;
    }

    const conversationId = isFirst ? Math.floor(Date.now() / 1000) : Number(conversationIdParam);
    const overview = message.slice(0, 50);

    // 1. Insert user message
    const userDbResult = await pool.query(
      `INSERT INTO chats (user_id, conversation_id, role, type, content, file_url, chat_overview)
       VALUES ($1, $2, 'user', $3, $4, $5, $6) RETURNING *`,
      [userId, conversationId, type, message, fileUrl, overview]
    );

    // 2. Fetch history & convert to LangChain messages
    const historyRes = await pool.query(
      `SELECT role, content FROM chats WHERE conversation_id = $1 ORDER BY id ASC`,
      [conversationId]
    );

    const history: BaseMessage[] = historyRes.rows.map((r) =>
      r.role === "user" ? new HumanMessage(r.content) : new AIMessage(r.content)
    );

    // 3. Run AI Agent
    const ai = await runAgent({
      messages: history,
      userId,
      conversationId,
      fileUrl,
      fileType: type,
    });

    // 4. Save AI message & return response
    const aiDbResult = await pool.query(
      `INSERT INTO chats (user_id, conversation_id, role, type, content, file_url, chat_overview)
       VALUES ($1, $2, 'assistant', $3, $4, $5, $6) RETURNING *`,
      [userId, conversationId, ai.type || "text", ai.content, ai.file_url || null, overview]
    );

    return NextResponse.json({
      success: true,
      userChat: userDbResult.rows[0],
      aiChat: aiDbResult.rows[0],
      conversation_id: conversationId,
    });
  } catch (error: unknown) {
    console.error("SUBMIT ERROR:", error);
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  let email:string | undefined;
  let name:string | undefined;

  try {
    const { token } = await req.json();
    if(!token){
      return NextResponse.json({ success: false, message: "Token is missing" }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.name || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Invalid payload from Google" },
        { status: 400 }
      );
    }

   name = payload.name;
    email = payload.email;

    await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2)`,
      [name, email]
    );




    const jwtToken = jwt.sign(
      { name, email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({ success: true, message:"User created successfully" });

    response.cookies.set("token", jwtToken, {
      httpOnly: true, 
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, 
    });

    return response;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" &&
      email
    ) {



      const jwtToken = jwt.sign(
        { name, email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const response = NextResponse.json({ success: true, messgae:"User Looged in Again" });

      response.cookies.set("token", jwtToken, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    console.error("Auth Error:", error);

    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function checkJWT(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    request.user = payload;

    return null;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export async function checkLoginJWT(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    request.user = payload;

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return null;
  }
}
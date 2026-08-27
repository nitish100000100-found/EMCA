import { NextRequest, NextResponse } from "next/server";
import { checkJWT, checkLoginJWT } from "@/middlwares/jwt";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const response = await checkJWT(request);

    if (response) {
      return response;
    }
  }

  if (pathname === "/login") {
    const response = await checkLoginJWT(request);

    if (response) {
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
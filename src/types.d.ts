import { Pool } from "pg";
import { JWTPayload } from "jose";

declare module "next/server" {
  interface NextRequest {
    user?: JWTPayload;
  }
}

declare global {
  var pgPool: Pool | undefined;
}

export {};
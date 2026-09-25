import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthRequest } from "@/lib/kickAuth";

const COOKIE = { httpOnly: true, secure: true, sameSite: "lax", path: "/api/kick", maxAge: 600 } as const;

function isAdmin(key: string | null) {
  const expected = process.env.KICK_ADMIN_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Starts the Kick login. Guarded by KICK_ADMIN_KEY so visitors can't replace the connected account. */
export function GET(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get("key"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { url, verifier, state } = createAuthRequest();
  const res = NextResponse.redirect(url);
  res.cookies.set("kick_verifier", verifier, COOKIE);
  res.cookies.set("kick_state", state, COOKIE);
  return res;
}

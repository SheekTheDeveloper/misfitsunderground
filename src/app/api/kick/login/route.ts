import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthRequest, KICK_FLOW_COOKIE } from "@/lib/kickAuth";

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

  const { url, verifier, state } = createAuthRequest("kicks:read");
  const res = NextResponse.redirect(url);
  res.cookies.set("kick_verifier", verifier, KICK_FLOW_COOKIE);
  res.cookies.set("kick_state", state, KICK_FLOW_COOKIE);
  res.cookies.set("kick_flow", "broadcaster", KICK_FLOW_COOKIE);
  return res;
}

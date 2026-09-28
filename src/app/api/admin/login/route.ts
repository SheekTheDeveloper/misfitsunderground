import { NextResponse } from "next/server";
import { createAuthRequest, KICK_FLOW_COOKIE } from "@/lib/kickAuth";

/** Starts "Log in with Kick" for /admin. Only asks Kick who the user is (user:read). */
export function GET() {
  const { url, verifier, state } = createAuthRequest("user:read");
  const res = NextResponse.redirect(url);
  res.cookies.set("kick_verifier", verifier, KICK_FLOW_COOKIE);
  res.cookies.set("kick_state", state, KICK_FLOW_COOKIE);
  res.cookies.set("kick_flow", "admin", KICK_FLOW_COOKIE);
  return res;
}

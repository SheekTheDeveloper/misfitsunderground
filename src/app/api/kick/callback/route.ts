import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createSession, isAllowedAdmin, SESSION_COOKIE } from "@/lib/adminSession";
import { exchangeCode, fetchKickUser } from "@/lib/kickAuth";

/** Handles both Kick logins: the broadcaster connection (/api/kick/login) and admin sign-in (/api/admin/login). */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const verifier = req.cookies.get("kick_verifier")?.value;
  const flow = req.cookies.get("kick_flow")?.value;

  const finish = (res: NextResponse) => {
    for (const name of ["kick_verifier", "kick_state", "kick_flow"]) res.cookies.delete({ name, path: "/api/kick" });
    return res;
  };
  const adminError = (error: string) => finish(NextResponse.redirect(new URL(`/admin?error=${error}`, req.url)));

  if (flow === "admin") {
    if (params.get("error")) return adminError("cancelled");
    if (!code || !state || !verifier || state !== req.cookies.get("kick_state")?.value) return adminError("expired");

    let user;
    try {
      user = await fetchKickUser(code, verifier);
    } catch (err) {
      console.error("Admin Kick sign-in failed:", err);
      return adminError("kick");
    }
    if (!isAllowedAdmin(user.id)) return adminError("not-admin");

    const session = createSession(user);
    const res = NextResponse.redirect(new URL("/admin", req.url));
    res.cookies.set(SESSION_COOKIE, session.value, session.options);
    return finish(res);
  }

  if (flow !== "broadcaster") {
    return new NextResponse("Login expired or invalid. Start again from the login link.", { status: 400 });
  }
  if (params.get("error")) {
    return new NextResponse(`Kick authorization was cancelled: ${params.get("error")}`, { status: 400 });
  }
  if (!code || !state || !verifier || state !== req.cookies.get("kick_state")?.value) {
    return new NextResponse("Login expired or invalid. Start again from the login link.", { status: 400 });
  }

  try {
    await exchangeCode(code, verifier);
  } catch (err) {
    console.error("Kick code exchange failed:", err);
    return new NextResponse("Couldn't finish connecting to Kick. Try the login link again.", { status: 500 });
  }

  revalidatePath("/gifters");
  return finish(NextResponse.redirect(new URL("/gifters", req.url)));
}

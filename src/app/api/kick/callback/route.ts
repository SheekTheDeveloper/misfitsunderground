import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/kickAuth";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const verifier = req.cookies.get("kick_verifier")?.value;

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
  const res = NextResponse.redirect(new URL("/gifters", req.url));
  res.cookies.delete({ name: "kick_verifier", path: "/api/kick" });
  res.cookies.delete({ name: "kick_state", path: "/api/kick" });
  return res;
}

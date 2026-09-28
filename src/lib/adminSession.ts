import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { site } from "@/config/site";

export const SESSION_COOKIE = "admin_session";
const MAX_AGE = 7 * 24 * 60 * 60;

export type Admin = { id: number; name: string };
type Payload = Admin & { exp: number };

function sign(data: string) {
  const secret = process.env.KICK_ADMIN_KEY;
  if (!secret) throw new Error("KICK_ADMIN_KEY must be set to sign admin sessions");
  return createHmac("sha256", `admin-session:${secret}`).update(data).digest("base64url");
}

export const isAllowedAdmin = (id: number) => site.admins.some((a) => a.kickUserId === id);

/** Signed cookie value for a signed-in admin, plus the cookie options to set it with. */
export function createSession(admin: Admin) {
  const data = Buffer.from(JSON.stringify({ ...admin, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return {
    value: `${data}.${sign(data)}`,
    options: { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAX_AGE } as const,
  };
}

function verify(value: string | undefined): Admin | null {
  const [data, sig] = value?.split(".") ?? [];
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
  // Re-check the allowlist so removing someone from site.admins signs them out.
  if (payload.exp < Date.now() || !isAllowedAdmin(payload.id)) return null;
  return { id: payload.id, name: payload.name };
}

/** The signed-in admin, or null. */
export async function getAdmin(): Promise<Admin | null> {
  return verify((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For server actions: the signed-in admin, or throws. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not signed in");
  return admin;
}

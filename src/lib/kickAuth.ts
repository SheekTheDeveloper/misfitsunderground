import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { site } from "@/config/site";
import { redis } from "./redis";

const AUTH_URL = "https://id.kick.com/oauth/authorize";
const TOKEN_URL = "https://id.kick.com/oauth/token";
const TOKENS_KEY = "kick:broadcaster-tokens";
/** kicks:read for the broadcaster connection; user:read to identify who is signing in to /admin. */
export type KickScope = "kicks:read" | "user:read";

/** Short-lived cookies that carry a login's PKCE verifier, state, and flow to /api/kick/callback. */
export const KICK_FLOW_COOKIE = { httpOnly: true, secure: true, sameSite: "lax", path: "/api/kick", maxAge: 600 } as const;

type StoredTokens = { accessToken: string; refreshToken: string; expiresAt: number };
type TokenResponse = { access_token: string; refresh_token: string; expires_in: number | string };

const redirectUri = () => process.env.KICK_REDIRECT_URI ?? `https://${site.domain}/api/kick/callback`;

function credentials() {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("KICK_CLIENT_ID and KICK_CLIENT_SECRET must be set");
  return { clientId, clientSecret };
}

const base64url = (buf: Buffer) => buf.toString("base64url");

/** Builds the Kick consent URL plus the PKCE verifier and state the callback must check. */
export function createAuthRequest(scope: KickScope) {
  const verifier = base64url(randomBytes(32));
  const state = base64url(randomBytes(16));
  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", credentials().clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", scope);
  url.searchParams.set("code_challenge", base64url(createHash("sha256").update(verifier).digest()));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return { url, verifier, state };
}

async function requestTokens(params: Record<string, string>): Promise<StoredTokens> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kick token endpoint responded ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  };
}

export async function exchangeCode(code: string, verifier: string) {
  const db = redis();
  if (!db) throw new Error("Upstash Redis is not configured");
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
  });
  await db.set(TOKENS_KEY, tokens);
}

/** Exchanges an admin sign-in code for the Kick user it belongs to. The token is used once and never stored. */
export async function fetchKickUser(code: string, verifier: string): Promise<{ id: number; name: string }> {
  const { accessToken } = await requestTokens({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
  });
  const res = await fetch("https://api.kick.com/public/v1/users", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kick users API responded ${res.status}: ${await res.text()}`);
  const { data } = (await res.json()) as { data: { user_id: number; name: string }[] };
  if (!data?.[0]) throw new Error("Kick users API returned no user");
  return { id: data[0].user_id, name: data[0].name };
}

/** When the stored broadcaster login expires (it refreshes itself), or null if King hasn't connected. */
export async function broadcasterConnection(): Promise<{ expiresAt: number } | null> {
  const stored = await redis()?.get<StoredTokens>(TOKENS_KEY);
  return stored ? { expiresAt: stored.expiresAt } : null;
}

/**
 * The broadcaster's access token, refreshed when it's within a minute of expiring.
 * Returns null until King has connected his account at /api/kick/login.
 */
export async function getBroadcasterToken(): Promise<string | null> {
  const db = redis();
  if (!db) return null;
  const stored = await db.get<StoredTokens>(TOKENS_KEY);
  if (!stored) return null;
  if (stored.expiresAt - 60_000 > Date.now()) return stored.accessToken;

  try {
    const fresh = await requestTokens({ grant_type: "refresh_token", refresh_token: stored.refreshToken });
    await db.set(TOKENS_KEY, fresh);
    return fresh.accessToken;
  } catch (err) {
    // Kick rotates refresh tokens, so a parallel request may have refreshed first. Use its result.
    const latest = await db.get<StoredTokens>(TOKENS_KEY);
    if (latest && latest.expiresAt - 60_000 > Date.now()) return latest.accessToken;
    throw err;
  }
}

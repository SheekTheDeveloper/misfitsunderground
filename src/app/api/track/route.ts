import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/config/site";
import { deviceType, isBot, recordHit, visitorHash, dayKey } from "@/lib/analytics";

const PATH = /^\/[a-z0-9/_-]{0,63}$/i;
const HOST = /^[a-z0-9.-]{1,64}$/i;
const ownHost = (host: string) => host === site.domain || host.endsWith(`.${site.domain}`) || host === "localhost";

/** Collects page views and outbound clicks from the Tracker component. Always answers 204. */
export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  // Local runs and preview deploys share the production database, so only production counts.
  if (process.env.VERCEL_ENV !== "production" && process.env.ANALYTICS_FORCE !== "1") return done;
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua) || req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return done;

  // Only count beacons sent from the site itself.
  const origin = req.headers.get("origin");
  if (origin && !ownHost(new URL(origin).hostname)) return done;

  let body: { t?: string; p?: string; r?: string; h?: string };
  try {
    body = JSON.parse((await req.text()).slice(0, 1000));
  } catch {
    return done;
  }

  try {
    if (body.t === "out" && body.h && HOST.test(body.h)) {
      await recordHit({ type: "out", host: body.h.replace(/^www\./, "").toLowerCase() });
    } else if (body.t === "view" && body.p && PATH.test(body.p) && !body.p.startsWith("/admin")) {
      let referrer: string | null = null;
      try {
        const host = body.r ? new URL(body.r).hostname.replace(/^www\./, "").toLowerCase() : "";
        if (host && HOST.test(host) && !ownHost(host)) referrer = host;
      } catch {}
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
      await recordHit({
        type: "view",
        path: body.p.toLowerCase(),
        referrer,
        country: req.headers.get("x-vercel-ip-country"),
        device: deviceType(ua),
        visitor: visitorHash(dayKey(new Date()), ip, ua),
      });
    }
  } catch (err) {
    console.error("Failed to record analytics hit:", err);
  }
  return done;
}

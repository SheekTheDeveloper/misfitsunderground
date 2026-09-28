import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/** Upstash Redis, configured either by Vercel's integration (KV_*) or manually (UPSTASH_*). Null when unset. */
export function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

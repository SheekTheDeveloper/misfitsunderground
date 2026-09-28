"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { requireAdmin, SESSION_COOKIE } from "@/lib/adminSession";
import { CONTENT_TAG, getPrizes, getStreams, logAction, savePrizes, saveStreams, verifyChannel, type Stream } from "@/lib/content";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const keyOf = (s: Stream) => `${s.platform}:${s.channel.toLowerCase()}`;
const label = (s: Stream) => `${s.name ?? s.channel} (${s.platform === "kick" ? "Kick" : "Twitch"})`;

function published(path: string) {
  updateTag(CONTENT_TAG);
  revalidatePath(path);
}

/** Accepts a bare name, @name, or a kick.com / twitch.tv link. A link decides the platform. */
function parseChannel(raw: string, platform: Stream["platform"]) {
  const link = raw.trim().match(/^(?:https?:\/\/)?(?:www\.)?(kick\.com|twitch\.tv)\/([^/?#\s]+)/i);
  if (link) return { platform: link[1].toLowerCase() === "kick.com" ? "kick" : "twitch", channel: link[2] } as const;
  return { platform, channel: raw.trim().replace(/^@/, "") };
}

export async function addStream(input: { platform: Stream["platform"]; channel: string; name: string }): Promise<Result<Stream[]>> {
  const admin = await requireAdmin();
  const { platform, channel } = parseChannel(input.channel, input.platform === "twitch" ? "twitch" : "kick");
  if (!/^[a-z0-9_-]{2,40}$/i.test(channel)) return { ok: false, error: "That doesn't look like a channel name." };

  const streams = await getStreams();
  if (streams.some((s) => keyOf(s) === `${platform}:${channel.toLowerCase()}`)) {
    return { ok: false, error: "That channel is already on the list." };
  }

  let slug: string | null;
  try {
    slug = await verifyChannel(platform, channel);
  } catch (err) {
    console.error("Channel lookup failed:", err);
    return { ok: false, error: `Couldn't reach ${platform === "kick" ? "Kick" : "Twitch"} to check that channel. Try again.` };
  }
  if (!slug) {
    return {
      ok: false,
      error: `No ${platform === "kick" ? "Kick" : "Twitch"} channel called "${channel}". Copy the name from the channel's URL (Kick uses hyphens or underscores).`,
    };
  }

  const name = input.name.trim().slice(0, 40);
  const added: Stream = { platform, channel: slug, ...(name ? { name } : {}) };
  const next = [...streams, added];
  await saveStreams(next);
  await logAction(admin.name, `Added ${label(added)}`);
  published("/streams");
  return { ok: true, value: next };
}

export async function removeStream(key: string): Promise<Result<Stream[]>> {
  const admin = await requireAdmin();
  const streams = await getStreams();
  const removed = streams.find((s) => keyOf(s) === key);
  if (!removed) return { ok: false, error: "That stream was already removed." };

  const next = streams.filter((s) => s !== removed);
  await saveStreams(next);
  await logAction(admin.name, `Removed ${label(removed)}`);
  published("/streams");
  return { ok: true, value: next };
}

export async function moveStream(key: string, direction: -1 | 1): Promise<Result<Stream[]>> {
  await requireAdmin();
  const next = [...(await getStreams())];
  const from = next.findIndex((s) => keyOf(s) === key);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= next.length) return { ok: true, value: next };

  [next[from], next[to]] = [next[to], next[from]];
  await saveStreams(next);
  published("/streams");
  return { ok: true, value: next };
}

export async function renameStream(key: string, rawName: string): Promise<Result<Stream[]>> {
  const admin = await requireAdmin();
  const name = rawName.trim().slice(0, 40);
  const streams = await getStreams();
  const target = streams.find((s) => keyOf(s) === key);
  if (!target) return { ok: false, error: "That stream was removed." };

  const renamed: Stream = { platform: target.platform, channel: target.channel, ...(name ? { name } : {}) };
  const next = streams.map((s) => (s === target ? renamed : s));
  await saveStreams(next);
  await logAction(admin.name, `Renamed ${label(target)} to "${name || target.channel}"`);
  published("/streams");
  return { ok: true, value: next };
}

export async function updatePrizes(prizes: number[]): Promise<Result<number[]>> {
  const admin = await requireAdmin();
  if (prizes.length > site.displayCount) {
    return { ok: false, error: `The board shows ${site.displayCount} places, so at most ${site.displayCount} prizes.` };
  }
  if (prizes.some((p) => !Number.isInteger(p) || p < 0 || p > 1_000_000)) {
    return { ok: false, error: "Prizes must be whole dollar amounts (0 or more)." };
  }
  // Trailing zeros would show as $0 prizes; drop them.
  const cleaned = [...prizes];
  while (cleaned.length && cleaned[cleaned.length - 1] === 0) cleaned.pop();

  const before = await getPrizes();
  await savePrizes(cleaned);
  const fmt = (list: number[]) => (list.length ? list.map((p) => `$${p}`).join(" / ") : "none");
  await logAction(admin.name, `Changed prizes from ${fmt(before)} to ${fmt(cleaned)}`);
  published("/");
  return { ok: true, value: cleaned };
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin");
}

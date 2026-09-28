"use client";

/** A timestamp in the viewer's own time zone. */
export function LocalTime({ at }: { at: number }) {
  return (
    <time dateTime={new Date(at).toISOString()} suppressHydrationWarning>
      {new Date(at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}

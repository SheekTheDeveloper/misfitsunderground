"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const send = (data: object) => navigator.sendBeacon?.("/api/track", JSON.stringify(data));

const optedOut = () =>
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true ||
  navigator.doNotTrack === "1";

/** Cookieless page-view and outbound-click counting. See src/lib/analytics.ts. */
export function Tracker() {
  const pathname = usePathname();
  const firstView = useRef(true);

  useEffect(() => {
    if (optedOut() || pathname.startsWith("/admin")) return;
    // The referrer only means something for the page someone landed on.
    send({ t: "view", p: pathname, r: firstView.current ? document.referrer : "" });
    firstView.current = false;
  }, [pathname]);

  useEffect(() => {
    if (optedOut()) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (link && link.host && link.host !== location.host) send({ t: "out", h: link.hostname });
    };
    // auxclick catches middle-clicks (open in new tab).
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("auxclick", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("auxclick", onClick, { capture: true });
    };
  }, []);

  return null;
}

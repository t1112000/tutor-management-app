"use client";

import { useEffect } from "react";

/** Remembers which build we already reloaded for, so a failed update can't loop. */
const RELOADED_FOR = "myclass:reloaded-for-build";
const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * Reloads the app in place when the server has been redeployed underneath it.
 *
 * An installed PWA can stay alive for days. Once a new build is deployed, the
 * old client's next `<Link>` navigation gets a payload from a different build,
 * and Next.js answers that by abandoning client-side routing for a full page
 * load. On iOS a standalone app opens that load in an in-app browser sheet, so
 * every tab tap pops a "link" window and the app itself never updates. Catching
 * the mismatch first and calling `location.reload()` keeps it inside the app.
 */
export function VersionWatcher({ buildId: current }: { buildId: string }) {
  useEffect(() => {
    if (current === "dev") return;
    let checking = false;

    const check = async () => {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        // Raw fetch, not api(): this is not app data and must not touch the query cache.
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId?: string };
        if (!buildId || buildId === "dev" || buildId === current) return;
        if (sessionStorage.getItem(RELOADED_FOR) === buildId) return;
        sessionStorage.setItem(RELOADED_FOR, buildId);
        window.location.reload();
      } catch {
        // Offline or mid-deploy: try again on the next trigger.
      } finally {
        checking = false;
      }
    };

    check();
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", check);
    window.addEventListener("online", check);
    // Capture phase, so a tap on a nav link checks before the router acts on it.
    document.addEventListener("pointerdown", check, { capture: true, passive: true });
    const timer = window.setInterval(check, CHECK_EVERY_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("online", check);
      document.removeEventListener("pointerdown", check, { capture: true });
      window.clearInterval(timer);
    };
  }, [current]);

  return null;
}

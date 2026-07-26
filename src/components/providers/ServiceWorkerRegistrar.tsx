"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every visit.
 *
 * It used to be registered only inside the push-notification opt-in, so anyone
 * who installed the app without enabling notifications had no service worker at
 * all — and the installed PWA showed the browser's network-error page offline.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[sw] registration failed:", err);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}

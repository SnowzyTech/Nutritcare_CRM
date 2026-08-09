"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on every page. Renders nothing.
 *
 * `updateViaCache: "none"` keeps the browser from serving a stale worker from
 * HTTP cache, so a deploy is picked up on the next navigation. When a new
 * worker is waiting we tell it to activate immediately — the cache holds only
 * content-hashed assets, so there is no half-old/half-new state to protect.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // A worker registered in dev would cache assets that are rebuilt constantly.
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch {
        // Registration failing must never break the app — the site still works
        // as a plain website, just without install/offline behaviour.
      }
    };

    // Wait for load so registration never competes with the first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

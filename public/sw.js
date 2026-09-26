/* Nutricare CRM service worker.
 *
 * SCOPE OF WHAT THIS CACHES — read before adding anything.
 *
 * This is a multi-role authenticated CRM, and staff phones get shared and
 * handed over. So the cache holds ONLY things that are identical for every
 * user and carry no business data:
 *
 *   • build assets under /_next/static/* (content-hashed, immutable)
 *   • the PWA icons and the /offline fallback page
 *
 * Everything else — HTML pages, RSC payloads, /api/*, anything authenticated,
 * anything that isn't a GET — goes straight to the network and is never
 * stored. That means the app does not "work offline" in the read-your-orders
 * sense; it means it launches from the home screen, survives a dropped signal
 * with a real message instead of the browser's dinosaur, and doesn't leave one
 * rep's data on the glass for the next person to find.
 *
 * Bump CACHE_VERSION to force every client to drop its old caches.
 *
 * It also receives Web Push (bottom of file) — see docs/notifications.md.
 */

const CACHE_VERSION = "v2";
const STATIC_CACHE = `nutricare-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individually, so one 404 can't fail the whole install.
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("nutricare-") && k !== STATIC_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Content-hashed build output and static icons — safe to cache, same for everyone. */
function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (Cloudinary, fonts, the chat socket) — leave entirely alone.
  if (url.origin !== self.location.origin) return;

  // Never touch auth or API traffic.
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first for immutable build assets. A hashed filename can never go
  // stale: a new build produces a new name.
  if (isCacheableAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
    return;
  }

  // Full-page navigations: always the network, with the offline page as the
  // only fallback. RSC payloads (client-side navigations) are deliberately
  // excluded — handing back an HTML document in place of a flight response
  // would break the router rather than degrade it.
  const isRscRequest = request.headers.has("RSC") || url.searchParams.has("_rsc");

  if (request.mode === "navigate" && !isRscRequest) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ??
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
  }

  // Everything else falls through to the network untouched and uncached.
});

// Lets the page tell a waiting worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ── Web Push ───────────────────────────────────────────────────────────────
 *
 * Payload (see lib/notifications/web-push.ts):
 *   { id, title, body, url, tag, priority: "critical" | "high" | "normal" }
 *
 * The payload text is written server-side to be lock-screen safe (order
 * number / product / state only — no customer details). Nothing here is cached.
 */

function safeUrl(url) {
  // Only same-origin, path-relative targets — a push can never open a foreign site.
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Nucle CRM", body: event.data ? event.data.text() : "" };
  }

  const critical = data.priority === "critical";
  const title = data.title || "Nucle CRM";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    // Same tag = the newer alert about an order replaces the older one…
    tag: data.tag || data.id || undefined,
    // …but still buzzes again when it matters.
    renotify: Boolean(critical && (data.tag || data.id)),
    requireInteraction: critical,
    vibrate: critical ? [200, 100, 200, 100, 200] : [100],
    timestamp: Date.now(),
    data: { url: safeUrl(data.url), id: data.id || null },
  };

  event.waitUntil(
    (async () => {
      // Userland must always show a notification for a push (userVisibleOnly).
      await self.registration.showNotification(title, options);

      // Let open tabs update their badge/list immediately.
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: "notification.push",
          notification: {
            id: data.id,
            type: data.type || "push",
            title,
            body: options.body,
            link: data.url ? safeUrl(data.url) : null,
            priority: data.priority || "normal",
          },
        });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(safeUrl(event.notification.data && event.notification.data.url), self.location.origin);

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Reuse an open app window rather than stacking new ones.
      for (const client of clients) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        try {
          await client.focus();
          if ("navigate" in client) await client.navigate(target.href);
          return;
        } catch {
          // fall through to opening a new window
        }
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});

// The push service rotated this browser's subscription (expiry, key change).
// Re-subscribe with the same server key and re-register it for the signed-in
// user; if nobody is signed in the POST 401s and the old row is pruned on its
// next failed send.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldKey = event.oldSubscription && event.oldSubscription.options.applicationServerKey;
        const sub =
          event.newSubscription ||
          (oldKey
            ? await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: oldKey })
            : null);
        if (!sub) return;
        await fetch("/api/notifications/push-subscription", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch {
        // best-effort; the app re-syncs the subscription on its next load
      }
    })(),
  );
});

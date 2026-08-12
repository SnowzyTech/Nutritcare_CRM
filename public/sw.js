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
 */

const CACHE_VERSION = "v1";
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

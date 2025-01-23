const CACHE_NAME = "screen-time-guardian-v2";

const PRECACHE_URLS = [
  "/app",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/timer-icon-48.png",
];

// Path to offline fallback
const OFFLINE_FALLBACK_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
    })()
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // for navigations, return offline fallback
        if (request.mode === "navigate") {
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          return fallback || new Response("Offline", { status: 503 });
        }
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});

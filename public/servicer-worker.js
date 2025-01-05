/* public/service-worker.js */

const CACHE_NAME = "screen-time-guardian-v2";

const PRECACHE_URLS = [
  "/",
  "/app",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon16.png",
  "/icons/icon48.png",
  "/icons/icon128.png",
  "/icons/icon192.png",
  "/icons/icon512.png",
];

// Path to my offline fallback
const OFFLINE_FALLBACK_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.error("Pre-caching failed:", err);
      });
    })
  );
  // Activate worker immediately after install
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
    })()
  );
  // Take control of clients after activation
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      // Check if the request is in cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Else, go to network
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          // Optionally add network response to cache
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // If it fails, serve offline fallback for navigations
        if (request.mode === "navigate" || request.destination === "document") {
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          return fallback || new Response("Offline", { status: 503 });
        }
        // For non-navigation requests, just return an error
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});

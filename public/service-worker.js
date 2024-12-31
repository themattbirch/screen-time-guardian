// public/service-worker.js

const CACHE_NAME = "screen-time-guardian-v1";
const ASSETS_TO_CACHE = [
  "/", // Your root index.html
  "/manifest.webmanifest",
  "/src/main.js", // or main.tsx -> after build, it might be /main.js
  "/icons/icon16.png",
  "/icons/icon48.png",
  "/icons/icon128.png",
  "/icons/icon512.png",
];

// Install event: cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate immediately once installed
  self.skipWaiting();
});

// Activate event: clean up old caches if needed
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
    })().then(() => self.clients.claim())
  );
});

// Fetch event: serve from cache if available, else go to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // Optionally show a fallback offline page
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })()
  );
});

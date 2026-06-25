const CACHE_NAME = "family-chores-pwa-v3";
const scopePath = self.registration.scope ? new URL(self.registration.scope).pathname : "/";
const basePath = scopePath.replace(/\/$/, "");
const APP_SHELL = [
  `${basePath}/`,
  `${basePath}/manifest.webmanifest`,
  `${basePath}/icons/icon.svg`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isNavigationRequest(request) {
  return request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let Firebase/Google/etc. pass through untouched.
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations/HTML so new deploys are picked up immediately.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(`${basePath}/`, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(`${basePath}/`).then((cached) => cached || caches.match(request)))
    );
    return;
  }

  // Cache-first for hashed static assets, with network fallback.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
    )
  );
});

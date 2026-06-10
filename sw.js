const APP_VERSION = "2.0.0";
const CACHE = `myfarmbox-ops-v${APP_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./version.json",
  "./logo.png",
  "./icons/harvest.svg",
  "./icons/whatsapp.svg",
  "./icons/consolidation.svg",
  "./icons/delivery.svg",
  "./icons/attendance.svg",
  "./icons/members.svg",
  "./icons/farm_pickup.svg",
  "./icons/website.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isAppShell = url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  const isVersionFile = url.pathname.endsWith("version.json");
  const isNavigation = event.request.mode === "navigate";

  if (isNavigation || isAppShell || isVersionFile) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

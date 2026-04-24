/* BuddyBuddha — offline shell cache */
const CACHE = "buddybuddha-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./buddy-buddha-app.html",
  "./shop.html",
  "./site.css",
  "./manifest.webmanifest",
  "./BuddyBuddha-02.png",
  "./assets/panel-daily.svg",
  "./assets/panel-share.svg",
  "./assets/panel-calm.svg",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        ASSETS.map(function (url) {
          return fetch(url)
            .then(function (res) {
              if (res.ok) return cache.put(url, res);
            })
            .catch(function () {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k !== CACHE;
        }).map(function (k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).catch(function () {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

const CACHE_NAME = "postlist-pwa-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./one.html",
  "./admin.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./styles.css",
  "./style.css",
  "./admin.css",
  "./main.js",
  "./search.js",
  "./admin.js",
  "./posts.json",
  "./js/posts-store.js",
  "./js/load.js",
  "./js/pagination.js",
  "./js/slider.js",
  "./js/slick.min.js",
  "./sidebar/index.js",
  "./sidebar/styles.css",
  "./slick/slick.css",
  "./slick/slick-theme.css",
  "./shop/logo192.png",
  "./shop/logo512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
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
  );
  self.clients.claim();
});

async function matchWithoutSearch(cache, request) {
  const url = new URL(request.url);
  url.search = "";
  return cache.match(url.href);
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request.url, response.clone());
    }
    return response;
  } catch (error) {
    return (
      (await cache.match(request.url)) ||
      (await matchWithoutSearch(cache, request)) ||
      (fallbackUrl && (await cache.match(fallbackUrl))) ||
      (await cache.match("./offline.html"))
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.endsWith("/posts.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(css|js)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

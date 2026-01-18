const CACHE_NAME = "radios-espana-v3";
const BASE_PATH = "/radios";
const ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/radios.json`,
  `${BASE_PATH}/images/icon.svg`,
  `${BASE_PATH}/images/cadena-ser.svg`,
  `${BASE_PATH}/images/rne-radio1.svg`,
  `${BASE_PATH}/images/rne-radio3.svg`,
  `${BASE_PATH}/images/rne-radio5.svg`,
  `${BASE_PATH}/images/rne-radioclasica.svg`,
  `${BASE_PATH}/images/radio-marca.svg`
];

// Instalación: cachear recursos estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: estrategia cache-first para assets, network-only para streams
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No cachear streams de audio
  if (
    url.pathname.includes("livestream") ||
    url.pathname.includes(".mp3") ||
    url.pathname.includes(".m3u8") ||
    url.hostname.includes("akamaized") ||
    url.hostname.includes("streamtheworld")
  ) {
    return;
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        // Solo cachear respuestas válidas
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

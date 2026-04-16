const CACHE_NAME = 'varta-v1';
const ASSETS = [
  '/varta-mobile',
  '/manifest.json',
  '/varta-logo-192.png',
  '/varta-logo-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

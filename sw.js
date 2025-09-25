// sw.js
const CACHE = 'ar-cache-v7';
const ASSETS = [
  '.', 'index.html', 'styles.css', 'app.js',
  'capture.js', 'manifest.webmanifest',
  'assets/overlay.png', 'assets/overlay.mp4', 'assets/targets.mind',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
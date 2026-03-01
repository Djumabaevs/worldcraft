const CACHE = 'worldcraft-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/city.js',
  './js/buildings.js',
  './js/terrain.js',
  './js/weather.js',
  './js/habits.js',
  './js/achievements.js',
  './js/ui.js',
  './js/storage.js',
  './js/audio.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

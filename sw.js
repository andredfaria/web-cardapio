const CACHE_NAME = 'drinks-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/admin.html',
    '/css/style.css',
    '/js/db.js',
    '/js/client.js',
    '/js/admin.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

const CACHE_NAME = 'drinks-v2';
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
    // Requisições à API nunca passam pelo cache — sempre vão ao servidor
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

// =============================================
// Service Worker — Program STB 2026
// v4 — Suport date externe (db.json)
// =============================================

const CACHE_NAME = 'stb-v4';
const STATIC_ASSETS = [
  '/ProgramSTB/',
  '/ProgramSTB/index.html',
  '/ProgramSTB/manifest.json',
  '/ProgramSTB/db.json' // Adăugat db.json pentru funcționare offline
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(e => console.warn('Cache partial:', e))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategie: Network First pentru date și pagină (pentru a vedea mereu ultimele ore)
  // Fallback la Cache dacă nu există internet.
  if (url.pathname.endsWith('db.json') || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategie: Cache First pentru restul activelor (imagini, fonturi, iconițe)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

/* Repartizare · Depoul Dudești — service worker
   index.html se ia întâi din rețea (ca să prinzi versiunea nouă imediat),
   restul din cache. Fără internet, aplicația merge din cache. */
const CACHE = 'repartizare-dudesti-v1';
const FISIERE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FISIERE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const esteIndex = req.mode === 'navigate' || req.url.endsWith('/') || req.url.endsWith('index.html');
  if (esteIndex) {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(x => {
        const cp = x.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return x;
      }).catch(() => r))
    );
  }
});

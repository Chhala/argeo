/* ════════════════════════════════════════════════════════
   ARGEO — Service Worker v2
   Cache-First global.
   Network-First pour missions.json : modifiable sans redéploiement.
   ════════════════════════════════════════════════════════ */

const CACHE  = 'argeo-v2';
const CORE   = ['./index.html', './manifest.json'];
const ASSETS = ['./apple-touch-icon.png', './icon-192.png', './icon-512.png'];

/* ── Install ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(CORE);
      await cache.addAll(ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate : purge anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  /* Network-First pour missions.json
     → le parent peut modifier/déployer missions.json
       sans toucher à index.html ni forcer un update SW.
     → fallback cache si hors-ligne.                        */
  if (event.request.url.includes('missions.json')) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          if (!resp || resp.status !== 200) return resp;
          caches.open(CACHE).then(c => c.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* Cache-First pour tout le reste */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        caches.open(CACHE).then(c => c.put(event.request, resp.clone()));
        return resp;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

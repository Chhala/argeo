/* ════════════════════════════════════════════════════════
   ARGEO — Service Worker v3
   Cache-First global.
   missions.json : jamais mis en cache par le SW.
     → Le navigateur gère lui-même la fraîcheur via les
       en-têtes HTTP de GitHub Pages (no-cache).
     → Hors-ligne : fetch échoue silencieusement,
       MissionsLoader retombe sur le fallback DEF embarqué.
   Firebase : exclu du cache (SDK gère son propre offline).
   ════════════════════════════════════════════════════════ */

const CACHE  = 'argeo-v3';
const CORE   = ['./index.html', './manifest.json'];
const ASSETS = ['./apple-touch-icon.png', './icon-192.png', './icon-512.png'];

/* Domaines à ne jamais intercepter */
const BYPASS = [
  'missions.json',
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseapp.com',
];
const _bypass = url => BYPASS.some(d => url.includes(d));

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
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  /* Laisse passer sans interception : missions.json + Firebase */
  if (_bypass(event.request.url)) return;

  /* Cache-First pour tout le reste (app shell, icônes…) */
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

/* Service worker mínimo — só para instalação e cache do "shell" estático.
   Nunca intercepta chamadas ao Firebase/Firestore. */
const CACHE = 'pyramid-v2';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './js/app.js',
  './js/calc.js',
  './js/charts.js',
  './js/firebase.js',
  './js/firebase-config.js',
  './js/store.js',
  './js/ui.js',
  './js/guide-content.js',
  './js/views/login.js',
  './js/views/dashboard.js',
  './js/views/weigh-in.js',
  './js/views/profile.js',
  './js/views/strength.js',
  './js/views/measurements.js',
  './js/views/supplements.js',
  './js/views/charts-view.js',
  './js/views/guide.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Deixa passar tudo que não for do próprio site (Firebase, CDN, etc.).
  if (url.origin !== self.location.origin) return;

  // Navegação: rede primeiro, cai pro cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Estáticos: cache primeiro, atualiza em segundo plano.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

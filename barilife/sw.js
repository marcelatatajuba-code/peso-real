/* ============================================================================
   sw.js — Service Worker da replica academica do Barilife.
   Estrategia: cache-first para os arquivos do app (funciona 100% offline),
   com atualizacao em segundo plano quando ha rede.
   ========================================================================== */
var CACHE = 'barilife-v5';

var ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/qr.js',
  './assets/js/data.js',
  './assets/js/mapa.js',
  './assets/js/app.js',
  './assets/img/sbcbm.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ARQUIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(nomes.filter(function (n) { return n !== CACHE; })
          .map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;

  ev.respondWith(
    caches.match(ev.request).then(function (cacheado) {
      var rede = fetch(ev.request).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copia = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        }
        return resp;
      }).catch(function () {
        return cacheado || caches.match('./index.html');
      });

      return cacheado || rede;
    })
  );
});

/*
 * sw.js — service worker da réplica.
 * Guarda os arquivos do app em cache para que ele abra sem internet,
 * que é o que permite instalar como aplicativo no iPhone.
 */
const CACHE = 'dne-replica-v1';

const ARQUIVOS = [
  './',
  './index.html',
  './css/app.css',
  './js/qr.js',
  './js/dados.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/foto-exemplo.svg',
  './assets/icone-180.png',
  './assets/icone-192.png',
  './assets/icone-512.png',
  './assets/icone-maskable-512.png'
];

// instala guardando tudo em cache
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

// remove versões antigas do cache ao ativar
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

// responde do cache primeiro; se não houver, busca na rede e guarda
self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  evento.respondWith(
    caches.match(req).then((emCache) => {
      if (emCache) return emCache;
      return fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200 && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copia));
          }
          return resposta;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

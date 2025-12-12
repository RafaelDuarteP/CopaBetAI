const CACHE_NAME = 'copabet-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições (Cache First, Network Fallback)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET ou chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Verifica se a resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque') {
          return response;
        }

        // Cacheia recursos externos importantes (esm.sh, flagcdn, unpkg, etc)
        const url = new URL(event.request.url);
        if (
            url.hostname.includes('esm.sh') || 
            url.hostname.includes('flagcdn.com') ||
            url.hostname.includes('lucide') ||
            url.hostname.includes('tailwindcss')
        ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      });
    })
  );
});
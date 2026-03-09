const CACHE_NAME = 'imomatch-v1';
const STATIC_ASSETS = [
  '/',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar e fazer cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignora erros de cache durante instalação
      });
    })
  );
  self.skipWaiting();
});

// Activar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', event => {
  // Ignora requests não-GET e requests para APIs externas
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Para Supabase e Stripe — sempre network
  if (url.hostname.includes('supabase') || 
      url.hostname.includes('stripe') ||
      url.hostname.includes('buy.stripe')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guarda em cache se for resposta válida
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, tenta servir do cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Para páginas HTML, serve a root
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Receber notificações push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ImoMatch';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Se já tem janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Senão, abre nova janela
        return clients.openWindow(url);
      })
  );
});

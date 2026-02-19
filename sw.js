

const CACHE_NAME = 'J.D.P.L-cache-v1'; // Identificador de cache versionado
const ASSETS_TO_PRECACHE = [
  '/', // Garante que a raiz do aplicativo (index.html) seja cacheada
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  // Adicione aqui outros assets críticos que devem estar offline (CSS, JS essenciais)
  // Exemplo: 'styles/main.css', 'js/app.js'
];

// Evento 'install': Instalação do Service Worker
self.addEventListener('install', (event) => {
  // HELENA. Status: Instalação iniciada.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // HELENA. Ação: Pré-caching de assets críticos.
        return cache.addAll(ASSETS_TO_PRECACHE);
      })
      .then(() => self.skipWaiting()) // Força a ativação imediata do novo Service Worker
      .catch((error) => {
        console.error('HELENA. Erro: Falha no pré-caching inicial.', error);
      })
  );
});

// Evento 'activate': Ativação do Service Worker
self.addEventListener('activate', (event) => {
  // HELENA. Status: Ativação iniciada.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // HELENA. Ação: Removendo caches obsoletos.
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Permite que o Service Worker controle os clientes imediatamente
  );
});

// Evento 'fetch': Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  // HELENA. Estratégia: Network First, then Cache.
  // Prioriza a rede para obter sempre o conteúdo mais recente.
  event.respondWith(
    fetch(event.request)
      .then(async (networkResponse) => {
        // Se a requisição de rede foi bem-sucedida (status 200, tipo 'basic'),
        // clona a resposta e armazena no cache.
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(async () => {
        // Se a rede falhou (offline ou erro), tenta buscar no cache.
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // HELENA. Status: Servindo recurso do cache.
          return cachedResponse;
        }
        // Se o recurso não está na rede nem no cache, retorna uma resposta de erro.
        // Opcional: Aqui você pode retornar uma página offline genérica se desejar.
        // Exemplo: return caches.match('/offline.html'); (garantir que offline.html esteja no ASSETS_TO_PRECACHE)
        console.warn('HELENA. Alerta: Recurso não disponível offline ou online:', event.request.url);
        return new Response('HELENA. Erro: Recurso não disponível. Verifique sua conexão.', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

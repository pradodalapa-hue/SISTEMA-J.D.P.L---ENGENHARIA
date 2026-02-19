

const CACHE_NAME = 'SISTEMA J.D.P.L - ENGENHARIA-cache-v1'; // Nome único do cache para fácil controle de versão

// Lista de URLs para cachear durante a instalação
// Garanta que TODOS os seus assets críticos (HTML, CSS, JS, Imagens, Fontes) estejam aqui.
const urlsToCache = [
  './', // A página principal (index.html)
  './index.html',
  './manifest.json',
  './sw.js', // O próprio Service Worker
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // !!! ATENÇÃO: COMPLETA A URL DO CDN ABAIXO !!!
  // Exemplo: 'https://cdnjs.cloudflare.com/ajax/libs/some-lib/1.0.0/some-lib.min.css'
  // Atualmente, a URL está incompleta no seu HTML:
  'https://cdnjs.cloudflare.com/ajax/libs/some-library/x.y.z/style.css' // <-- SUBSTITUA ESTA LINHA PELA SUA URL COMPLETA
  // Adicione outras fontes, JS, imagens, etc., conforme necessário.
];

// Evento 'install': Disparado quando o Service Worker é instalado.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando assets...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o Service Worker a assumir o controle imediatamente
      .catch((error) => {
        console.error('[Service Worker] Falha ao cachear durante a instalação:', error);
      })
  );
});

// Evento 'activate': Disparado quando o Service Worker é ativado.
// Usado para limpar caches antigos.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Permite que o Service Worker controle imediatamente os clientes ativos
  );
});

// Evento 'fetch': Intercepta todas as requisições de rede.
// Implementa uma estratégia "Cache-First, Fallback to Network".
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se a requisição for encontrada no cache, retorna a resposta do cache.
        if (response) {
          console.log('[Service Worker] Servindo do cache:', event.request.url);
          return response;
        }

        // Se não estiver no cache, faz a requisição à rede.
        console.log('[Service Worker] Buscando da rede e cacheando:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Verifica se a resposta da rede é válida antes de adicionar ao cache.
            // Isso evita cachear respostas de erro (ex: 404, 500) ou requisições não-GET.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta para que uma cópia possa ser lida e adicionada ao cache,
            // enquanto a original é enviada ao navegador.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.warn('[Service Worker] Falha ao cachear resposta da rede:', event.request.url, error);
              });

            return networkResponse;
          })
          .catch(() => {
            // Fallback para uma página offline se a rede e o cache falharem.
            // Para isso, você precisaria ter uma 'offline.html' cacheada.
            // Por simplicidade, este exemplo não inclui uma 'offline.html' dedicada,
            // mas você pode adicionar essa funcionalidade se desejar.
            console.error('[Service Worker] Falha na requisição e não encontrado no cache:', event.request.url);
            // return caches.match('/offline.html'); // Exemplo de fallback para offline page
          });
      })
  );
});
const cacheName = 'SiSTEMA J.D.P.L - ENGENHARIA';
const assets = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. Instalação e Forçar Atualização
self.addEventListener('install', e => {
  self.skipWaiting(); // Força o novo worker a assumir o controle na hora
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('Kernel: Pré-carregando Ativos');
      return cache.addAll(assets);
    })
  );
});

// 2. Ativação e Limpeza de Cache Velho
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Estratégia de Rede Primeiro (O SEGREDO DO TEMPO REAL)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Se a rede funcionar, clona a resposta para o cache
        const resClone = res.clone();
        caches.open(cacheName).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request)) // Se a rede falhar (offline), usa o cache
  );
});

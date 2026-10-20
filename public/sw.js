// Ao mudar arquivos essenciais, aumente a versão para que os aparelhos descartem o cache antigo.
const CACHE = 'projeto-missionario-v2';

const ARQUIVOS_ESSENCIAIS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/app.css',
  '/js/main.js',
  '/icons/icon.svg',
  '/vendor/bootstrap/css/bootstrap.min.css',
  '/vendor/bootstrap/js/bootstrap.bundle.min.js',
  '/vendor/bootstrap-icons/bootstrap-icons.min.css',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro: busca sempre a versão mais nova e usa o cache apenas sem internet.
// A API nunca é guardada em cache, para não exibir dados desatualizados ou de outra conta.
self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  evento.respondWith(
    fetch(request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return resposta;
      })
      .catch(async () => {
        const salva = await caches.match(request);
        if (salva) return salva;
        if (request.mode === 'navigate') return caches.match('/index.html');
        return Response.error();
      }),
  );
});

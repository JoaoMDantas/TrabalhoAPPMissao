// Ao mudar arquivos essenciais, aumente a versão para que os aparelhos descartem o cache antigo.
const CACHE = 'projeto-missionario-v10';
// PDFs da trilha de capacitação ficam num cache à parte, mantido entre versões do app, para ler sem internet.
const CACHE_ARQUIVOS = 'projeto-missionario-arquivos';
const ARQUIVO_DE_MATERIAL = /^\/api\/materiais\/\d+\/arquivo$/;

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
  '/vendor/poppins/poppins-latin-400-normal.woff2',
  '/vendor/poppins/poppins-latin-500-normal.woff2',
  '/vendor/poppins/poppins-latin-600-normal.woff2',
  '/vendor/poppins/poppins-latin-700-normal.woff2',
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
      .then((chaves) =>
        Promise.all(
          chaves.filter((chave) => chave !== CACHE && chave !== CACHE_ARQUIVOS).map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// PDF de material: usa a cópia guardada no aparelho; se ainda não houver, baixa e guarda para a próxima vez.
async function arquivoGuardado(evento) {
  const cache = await caches.open(CACHE_ARQUIVOS);
  const guardado = await cache.match(evento.request);
  if (guardado) return guardado;
  const resposta = await fetch(evento.request);
  if (resposta.ok) evento.waitUntil(cache.put(evento.request, resposta.clone()));
  return resposta;
}

// Rede primeiro: busca sempre a versão mais nova e usa o cache apenas sem internet.
// A API nunca é guardada em cache, para não exibir dados desatualizados ou de outra conta
// (a exceção são os PDFs da trilha, que são públicos e não mudam).
self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (ARQUIVO_DE_MATERIAL.test(url.pathname)) {
    evento.respondWith(arquivoGuardado(evento));
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

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

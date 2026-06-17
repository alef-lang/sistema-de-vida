// ── Sistema de Vida — Service Worker ──
// Atualize a versão sempre que publicar mudanças significativas.
// O navegador detecta a mudança e baixa o novo cache automaticamente.
const VERSION = 'sdv-v1';

const CACHE_SHELL = [
  '/sistema-de-vida/',
  '/sistema-de-vida/index.html',
  '/sistema-de-vida/manifest.json',
  '/sistema-de-vida/identidade_perfil.html',
  '/sistema-de-vida/sonhos_tdah.html',
  '/sistema-de-vida/ideias/ideias.html',
  '/sistema-de-vida/prosperidade/index-financas.html',
  '/sistema-de-vida/prosperidade/aquisicoes_tdah.html',
  '/sistema-de-vida/prosperidade/despesas_mes_tdah.html',
  '/sistema-de-vida/prosperidade/dividas_tdah.html',
  '/sistema-de-vida/prosperidade/projecoes_tdah.html',
];

// ── INSTALL: armazena o shell em cache ──
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CACHE_SHELL))
  );
});

// ── ACTIVATE: remove caches antigos ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: network-first para Firebase, cache-first para shell ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase e APIs externas: sempre rede (não cacheia)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('fonts.google') ||
    event.request.method !== 'GET'
  ) {
    return; // deixa passar normalmente
  }

  // Shell do app: cache-first com fallback para rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacheia páginas do próprio site
        if (
          response.ok &&
          url.origin === self.location.origin &&
          url.pathname.startsWith('/sistema-de-vida/')
        ) {
          const clone = response.clone();
          caches.open(VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline: retorna index como fallback
        return caches.match('/sistema-de-vida/index.html');
      });
    })
  );
});

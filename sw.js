// Service Worker for Pondok Futsal Cup Offline PWA Support
const CACHE_NAME = 'acc-al-fayyadh-futsal-v44';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
  './js/admin.js',
  './js/supabase-client.js',
  './js/security.js',
  './assets/acc_logo.png',
  './assets/hero_banner.jpg',
  './assets/mvp_player.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Tolerant asset caching (doesn't abort if a single asset has network glitch)
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => cache.add(url).catch((err) => console.warn('Cache add skipped for', url, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass Service Worker for Supabase, YouTube, and external APIs
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // Handle HTML navigation requests (opening the portal link)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('./index.html') || await caches.match('./') || await caches.match('index.html');
          if (cached) return cached;
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACC 2026 - Menghubungkan...</title><style>body{font-family:sans-serif;text-align:center;padding:40px 20px;background:#0f172a;color:#fff}h2{color:#10b981}button{margin-top:20px;padding:12px 24px;border-radius:8px;border:none;background:#10b981;color:#fff;font-weight:bold;cursor:pointer;font-size:1rem}</style></head><body><h2>⚽ ACC "Al-Fayyadh Champions Cup" 2026</h2><p>Koneksi internet Anda sedang memuat. Silakan periksa sinyal dan klik tombol di bawah untuk membuka portal.</p><button onclick="location.reload()">Buka / Muat Ulang Halaman 🔄</button></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Network first for static assets, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) {
          return cached;
        }
        return new Response('', { status: 404, statusText: 'Not found in cache' });
      })
  );
});

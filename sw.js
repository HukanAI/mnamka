/* Mňamka – service worker.
 * Shell: stale-while-revalidate, data JSON: network-first, obrázky: cache-first
 * (po načtení dat je appka předcachuje), videa: jen runtime cache při přehrání. */
const VERSION = 'v4';
const SHELL_CACHE = `mnamka-shell-${VERSION}`;
const DATA_CACHE = `mnamka-data-${VERSION}`;
const IMG_CACHE = `mnamka-img-${VERSION}`;
const VIDEO_CACHE = `mnamka-video-${VERSION}`;
const CURRENT = [SHELL_CACHE, DATA_CACHE, IMG_CACHE, VIDEO_CACHE];

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/install.js',
  'js/store.js',
  'js/views/common.js',
  'js/views/recipes.js',
  'js/views/detail.js',
  'js/views/favorites.js',
  'js/views/plan.js',
  'js/views/shopping.js',
  'js/views/inspiration.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];
const DATA = ['data/recipes.json', 'data/menus.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL);
    // Data mohou chybět (např. menus.json) – instalaci to nesmí shodit.
    const data = await caches.open(DATA_CACHE);
    await Promise.all(DATA.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) await data.put(url, res);
      } catch { /* offline nebo chybí */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('mnamka-') && !CURRENT.includes(k))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'precache-images' && Array.isArray(msg.urls)) {
    event.waitUntil(precacheImages(msg.urls));
  }
});

async function precacheImages(urls) {
  const cache = await caches.open(IMG_CACHE);
  const scope = self.registration.scope;
  for (const u of urls) {
    const url = new URL(u, scope).href;
    if (await cache.match(url)) continue;
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    } catch { /* zkusíme příště */ }
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;

  if (path.includes('/media/video/')) {
    event.respondWith(videoResponse(req));
  } else if (path.includes('/media/img/')) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
  } else if (path.includes('/data/') && path.endsWith('.json')) {
    event.respondWith(networkFirst(req, DATA_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE, event));
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName, event) {
  const cache = await caches.open(cacheName);
  const isNav = req.mode === 'navigate';
  const key = isNav ? 'index.html' : req;
  const hit = await cache.match(key, { ignoreSearch: isNav });
  const refresh = fetch(req).then((res) => {
    if (res.ok) cache.put(key, res.clone());
    return res;
  });
  if (hit) {
    event.waitUntil(refresh.catch(() => {}));
    return hit;
  }
  return refresh;
}

/* Video: <video> posílá Range požadavky, které nejdou uložit (206). Při prvním
 * přehrání stáhneme celé video, uložíme a odpovídáme výřezy z cache. */
const videoDownloads = new Map();

async function videoResponse(req) {
  const cache = await caches.open(VIDEO_CACHE);
  const url = req.url;
  let full = await cache.match(url);
  if (!full) {
    try {
      if (!videoDownloads.has(url)) {
        videoDownloads.set(url, fetch(url).then(async (res) => {
          if (res.ok) await cache.put(url, res);
          return res.ok;
        }).finally(() => videoDownloads.delete(url)));
      }
      const ok = await videoDownloads.get(url);
      full = ok && await cache.match(url);
      if (!full) return fetch(req);
    } catch {
      return fetch(req);
    }
  }
  const range = req.headers.get('range');
  if (!range) return full;
  const blob = await full.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = blob.size;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (m && !m[1] && m[2]) { start = size - parseInt(m[2], 10); end = size - 1; }
  end = Math.min(end, size - 1);
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

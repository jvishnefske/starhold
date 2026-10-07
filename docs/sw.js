// Starhold service worker: app shell works offline; peer-to-peer traffic is never touched.
const VERSION = 'starhold-v4';
const FONTS = 'starhold-fonts';   // fonts never change, so this cache outlives app versions
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'vendor/peerjs.min.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // no skipWaiting here: the page shows "Update ready" and the player chooses when to reload
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});
self.addEventListener('message', e => { if (e.data?.t === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    // stale-while-revalidate: open instantly, pick up new versions on the next launch
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, {ignoreSearch: req.mode === 'navigate'}) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      const net = fetch(req).then(res => { if (res.ok) cache.put(req.mode === 'navigate' ? 'index.html' : req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  } else if (FONT_HOSTS.includes(url.hostname)){
    e.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }));
  }
  // everything else (the matchmaking server) goes straight to the network
});

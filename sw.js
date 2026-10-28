// Çevrimdışı önbellek. Sürüm numarasını her yayında artır.
const CACHE = "nakkas-v4";
const CORE = ["./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./src/app.js", "./src/geometry.js", "./src/pieces.js",
  "./src/modes/kur.js", "./src/modes/construct.js", "./src/modes/mirror.js", "./src/cards.js", "./src/modes/tani.js", "./src/modes/yarat.js",
  "./data/pieces.json", "./data/motifs.json", "./data/levels.json",
  "./assets/pieces/sekiz-kose-yildiz.svg"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
  }).catch(() => hit)));
});

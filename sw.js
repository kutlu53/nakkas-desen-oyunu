// Çevrimdışı önbellek. Sürüm numarasını her yayında artır.
const CACHE = "nakkas-v12";
const CORE = ["./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./src/app.js", "./src/geometry.js", "./src/pieces.js",
  "./src/modes/kur.js", "./src/modes/construct.js", "./src/modes/mirror.js", "./src/cards.js", "./src/rank.js", "./src/sound.js", "./src/modes/tani.js", "./src/modes/yarat.js",
  "./data/pieces.json", "./data/motifs.json", "./data/levels.json", "./data/tani.json",
  "./assets/pieces/sekiz-kose-yildiz.svg"];
// Kurulum: dosyalar sırayla tek tek önbelleğe alınır. Toplu addAll, aynı önbelleğe eşzamanlı yazmada
// "Entry already exists" ile bütünüyle reddediliyor ve service worker hiç kurulmuyordu; biri başarısız olsa da öbürleri kalır.
self.addEventListener("install", (e) => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  for (const url of CORE) { try { await c.add(url); } catch { /* sonraki çevrimiçi istekte önbelleğe girer */ } }
  await self.skipWaiting();
})()));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); }
    return res;
  }).catch(() => hit)));
});

// Setin 10'lu gül motifinin iç kısmı: ongen + çevresindeki 10 beşgen üzerinde Hankin 72°.
// Çıkan parçalar: sivri 10'lu yıldız {10/4} (uç 36°), 10 yaprak (setin "uzun beşgen"i; 6 köşe 72/144/108/144/108/144), 10 beş köşeli yıldız {5/2}.
// Kullanım: node build/gen_rose.mjs → build/rose_pieces.json (gen_pieces.py okur) ve çıktı.json'a f10-l5 seviyesi.
// Ölçek: sivri yıldızın dış yarıçapı = 1; yön: yıldız uçları 18° + 36°k (öbür yıldızlarla aynı).
// Dış halka (çentikli altıgen, ok ucu, taçlı kalkan) henüz türetilmedi: alt ağın dış halkası bilinmiyor.
import { writeFileSync } from "node:fs";
import { tilesFromEdges, polygonEdges, hankinLines, patternFaces, centroid } from "./hankin.mjs";
import * as G from "../src/geometry.js";

const D = Math.PI / 180, r6 = (v) => Math.round(v * 1e6) / 1e6 + 0;
const assert = (c, m) => { if (!c) throw new Error("denetim: " + m); };
const e = 1, R = e / (2 * Math.sin(18 * D));
const dec = [...Array(10)].map((_, k) => [R * Math.cos((18 + 36 * k) * D), R * Math.sin((18 + 36 * k) * D)]);
const polys = [dec];
for (let i = 0; i < 10; i++) { // her kenara dışa doğru düzgün beşgen; ongen köşesinde 144 + 108 + 108 = 360
  const p = dec[i], q = dec[(i + 1) % 10], pts = [p, q];
  let a = Math.atan2(q[1] - p[1], q[0] - p[0]);
  for (let k = 0; k < 3; k++) { a -= 72 * D; const l = pts[pts.length - 1]; pts.push([l[0] + e * Math.cos(a), l[1] + e * Math.sin(a)]); }
  polys.push(pts);
}
assert(polys.slice(1).every((P) => Math.hypot(...centroid(P)) > R), "beşgenler dışarıda");
const faces0 = patternFaces(hankinLines(tilesFromEdges(polys.flatMap(polygonEdges)), 72), 3.2)
  .filter((P) => polys.some((T) => G.pointInPolygon(centroid(P), T) || G.distToBoundary(centroid(P), T) < 1e-6));
// 18° döndür (uçlar 18° + 36°k), yıldız yarıçapı 1 olacak biçimde ölçekle
const starRaw = faces0.find((P) => P.length === 20);
const s = 1 / Math.max(...starRaw.map((p) => Math.hypot(...p))), rr = 18 * D;
const tf = ([x, y]) => [s * (x * Math.cos(rr) - y * Math.sin(rr)), s * (x * Math.sin(rr) + y * Math.cos(rr))];
const faces = faces0.map((P) => P.map(tf));
const byLen = (n) => faces.filter((P) => P.length === n);
const [star] = byLen(20), petals = byLen(6), pents = byLen(10);
assert(petals.length === 10 && pents.length === 10, `parça sayısı: ${petals.length} yaprak, ${pents.length} beş köşeli yıldız`);
assert(G.interiorAngles(star).every((a) => Math.abs(a - 36) < 0.5 || Math.abs(a - 288) < 0.5), "yıldız 36/288");
assert(star.filter((p) => Math.abs(Math.atan2(p[1], p[0]) / D + 90) < 0.5 && Math.hypot(...p) > 0.99).length === 1, "bir uç tepede (−90°)");

// yerel biçim: tepedeki (−90° yönündeki) örneğin ağırlık merkezine göre; öbür dokuzu 36°k dönmeleri
const local = (list) => {
  const top = list.reduce((b, P) => (Math.abs(Math.atan2(centroid(P)[1], centroid(P)[0]) / D + 90) < Math.abs(Math.atan2(centroid(b)[1], centroid(b)[0]) / D + 90) ? P : b));
  const c = centroid(top);
  return top.map(([x, y]) => [r6(x - c[0]), r6(y - c[1])]);
};
const shapes = { "sivri-yildiz-10": star.map(([x, y]) => [r6(x), r6(y)]), "besgen-uzun": local(petals), "bes-kose-yildiz": local(pents) };
const place = (id, P) => {
  const piece = { points: shapes[id] }, c = centroid(P);
  for (let r = 0; r < 360; r += 36) if (G.samePointSet(G.placedPoints(piece, { x: c[0], y: c[1], rot: r }), P, 1e-4)) return { pieceId: id, x: r6(c[0]), y: r6(c[1]), rot: r };
  throw new Error(`${id}: 36°'nin katlarıyla yerleşmiyor`);
};
const targets = [...petals.map((P) => place("besgen-uzun", P)), ...pents.map((P) => place("bes-kose-yildiz", P))];
// köşe ilişkileri (metinde kullanılanlar)
const lib = { ...Object.fromEntries(Object.entries(shapes).map(([k, v]) => [k, { points: v, angles: G.interiorAngles(v) }])) };
const scene = [{ piece: lib["sivri-yildiz-10"], placement: { x: 0, y: 0, rot: 0 } }, ...targets.map((t) => ({ piece: lib[t.pieceId], placement: t }))];
const vs = G.evaluateVertices(scene);
assert(vs.every((v) => v.state !== "cakisma"), "gülde çakışma yok");
const combos = [...new Set(vs.filter((v) => v.state === "tam").map((v) => v.parts.map((p) => Math.round(p.angle)).sort((a, b) => a - b).join(" + ")))];
console.log("tam köşeler:", combos.join(" | "));

writeFileSync(new URL("./rose_pieces.json", import.meta.url), JSON.stringify({ _not: "build/gen_rose.mjs üretir; gen_pieces.py okur.", ...shapes }, null, 1));
const level = {
  id: "f10-l5", family: 10, order: 5, title: "Gül",
  story: "Usta: 'Setin gülü: ortada sivri bir yıldız, çevresinde on yaprak, aralarında beş köşeli yıldızlar. Önce yaprakları diz.'",
  _not: "build/gen_rose.mjs üretir: ongen + 10 beşgen üzerinde Hankin 72° (Motifler klasöründeki setin gül fotoğraflarının iç kısmı). Dış halka henüz yok.",
  fixed: [{ pieceId: "sivri-yildiz-10", x: 0, y: 0, rot: 0 }],
  tray: { "besgen-uzun": 10, "bes-kose-yildiz": 10 }, trayDistractors: { lise: { besgen: 2, "on-kose-yildiz": 1 } },
  targets,
  hint: { ortaokul: "Yıldızın çentiği 72° boşluk bırakır (360 − 288). Yaprağın sivri ucu 72°: ucunu çentiğe koy. Sonra yaprakların arasına beş köşeli yıldızları.", lise: "Sivri yıldızın çentiğinde kaç derece kalıyor? Kutudaki hangi köşe ona eşit?" },
  discovery: "Sivri yıldızın çentiği 72°: yaprağın ucu tam oturur, 288 + 72 = 360. Yaprağın 108°'lik köşesi beş köşeli yıldızın çentiğine girer: 108 + 252 = 360. Yıldızın ucunda dört parça buluşur: 36 + 36 + 144 + 144 = 360. Bu gülde bütün açılar 36°'nin katıdır, çünkü hepsi bir ongenin ve çevresindeki beşgenlerin içine 72° ile çizilen çizgilerden çıkar. Setteki gül bu üç parçayla başlar.",
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(level, null, 1));
console.log("gül:", targets.length, "hedef; yaprak dönmeleri", [...new Set(targets.filter((t) => t.pieceId === "besgen-uzun").map((t) => t.rot))].join(","));

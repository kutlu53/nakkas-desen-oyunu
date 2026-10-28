// Çırak / Tanı modunun desen çizimlerini üretir: data/tani.json.
// Her aile için kesin bir desen: 8'li yıldız-haç, 10'lu girih (Hankin 54°), 6'lı yıldız-altıgen, 12'li 4.6.12 ağı üstünde Hankin 60°.
// Çıktı: yüzler (SVG path + renk), ana yıldızların merkezleri, kafes vektörleri; yıldızı bul / köşe say / birim hücre görevleri bunları kullanır.
import { readFileSync, writeFileSync } from "node:fs";
import { hankin, hankinLines, tilesFromEdges, polygonEdges, patternFaces, centroid, angles } from "./hankin.mjs";
import * as G from "../src/geometry.js";

const D = Math.PI / 180;
const { pieces } = JSON.parse(readFileSync(new URL("../data/pieces.json", import.meta.url), "utf8"));
const by = Object.fromEntries(pieces.map((p) => [p.id, p]));
const VIEW = [-4.4, -3.3, 8.8, 6.6];
const COL = { kobalt: "#1f2a7a", firuze: "#6aa6c8", beyaz: "#ece9e2", hardal: "#e2a92b", kiremit: "#b8392e", lacivert: "#2b3a8f" };
const r3 = (v) => Math.round(v * 1000) / 1000 + 0;
const pathOf = (P) => "M" + P.map(([x, y]) => `${r3(x)},${r3(y)}`).join("L") + "Z";
const visible = (P) => { const b = G.bbox(P); return b.maxx > VIEW[0] && b.minx < VIEW[0] + VIEW[2] && b.maxy > VIEW[1] && b.miny < VIEW[1] + VIEW[3]; };
const inner = ([x, y], m = 0.35) => x > VIEW[0] + m && x < VIEW[0] + VIEW[2] - m && y > VIEW[1] + m && y < VIEW[1] + VIEW[3] - m;
const lattice = (a, b, n) => { const out = []; for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) out.push([i * a[0] + j * b[0], i * a[1] + j * b[1]]); return out; };
const assert = (c, msg) => { if (!c) throw new Error("denetim başarısız: " + msg); };

function pack(family, faces, starTest, a, b, colorOf) {
  const vis = faces.filter(visible);
  const stars = vis.filter(starTest).map(centroid).filter((c) => inner(c)).map(([x, y]) => [r3(x), r3(y)]);
  const sample = vis.find(starTest), ang = angles(sample).map((x) => Math.round(360 - x)); // hankin açıları dış açıdır
  const tips = ang.filter((x) => x < 180).length;
  return { family, view: VIEW, a: a.map(r3), b: b.map(r3), cellArea: r3(Math.abs(a[0] * b[1] - a[1] * b[0])), tipAngle: Math.min(...ang), notch: 360 - Math.max(...ang), tips,
    faces: vis.map((P) => ({ d: pathOf(P), fill: colorOf(P) })), stars };
}
const fromPieces = (list) => list.map(({ pieceId, x, y, rot }) => G.placedPoints(by[pieceId], { x, y, rot }).map(([u, v]) => [u, v]));

// ---- 8'li: yıldız-haç (yıldızlar 2ℤ², haçlar 2ℤ² + (1,1)) ----
function f8() {
  const a = [2, 0], b = [0, 2], list = [];
  for (const [x, y] of lattice(a, b, 4)) { list.push({ pieceId: "sekiz-kose-yildiz", x, y, rot: 0 }); list.push({ pieceId: "hac", x: x + 1, y: y + 1, rot: 0 }); }
  const faces = fromPieces(list);
  return pack(8, faces, (P) => P.length === 16 && Math.abs(G.signedArea(P)) > 2, a, b, (P) => (P.length === 16 && Math.abs(G.signedArea(P)) > 2 ? COL.kobalt : COL.beyaz));
}
// ---- 10'lu: girih ongen + papyon, Hankin 54° ----
function f10() {
  const { a, b, faces } = hankin({ rot: 18, range: 4, keep: 6.5 });
  const col = { 20: COL.firuze, 5: COL.kiremit, 8: COL.hardal, 4: COL.beyaz };
  return pack(10, faces, (P) => P.length === 20, a, b, (P) => col[P.length] || COL.beyaz);
}
// ---- 6'lı: altı köşeli yıldızlar uç uca, aralarında altıgenler (üç yıldızın ortasında) ----
function f6() {
  const star = by["alti-kose-yildiz"], R = 1, a = [2 * Math.cos(30 * D), 2 * Math.sin(30 * D)], b = [0, 2];
  const hexR = Math.min(...star.points.map((p) => Math.hypot(...p))); // altıgen çevrel yarıçapı = yıldız iç yarıçapı = kenar
  const faces = [];
  for (const c of lattice(a, b, 5)) {
    faces.push(star.points.map(([x, y]) => [x + c[0], y + c[1]]));
    for (const [p, q] of [[a, b], [b, [b[0] - a[0], b[1] - a[1]]]]) {
      const h = [c[0] + (p[0] + q[0]) / 3, c[1] + (p[1] + q[1]) / 3], phi = Math.atan2(c[1] - h[1], c[0] - h[0]);
      faces.push(Array.from({ length: 6 }, (_, k) => [h[0] + hexR * Math.cos(phi + k * 60 * D), h[1] + hexR * Math.sin(phi + k * 60 * D)]));
    }
  }
  void R;
  const near = faces.filter((P) => Math.hypot(...centroid(P)) < 3);
  const v = G.evaluateVertices(near.map((P) => ({ piece: { points: P.map(([x, y]) => [x - centroid(P)[0], y - centroid(P)[1]]), angles: G.interiorAngles(P) }, placement: { x: centroid(P)[0], y: centroid(P)[1], rot: 0 } })));
  assert(v.every((x) => x.state !== "cakisma") && v.some((x) => x.state === "tam"), "6'lı desen köşeleri");
  return pack(6, faces, (P) => P.length === 12, a, b, (P) => (P.length === 12 ? COL.kobalt : COL.firuze));
}
// ---- 12'li: 4.6.12 ağı (onikigenler, kareler, altıgenler) üstünde Hankin 60°; onikigenin içinde {12/4} benzeri yıldız (uç 60°, çentik 270°) ----
function f12() {
  const e = 2 * Math.tan(15 * D), Rd = e / (2 * Math.sin(15 * D)), S = 2 + e; // kenar-orta = 1 → yıldız dış yarıçapı 1
  const a = [S, 0], b = [S * Math.cos(60 * D), S * Math.sin(60 * D)];
  const dodec = (c) => Array.from({ length: 12 }, (_, k) => [c[0] + Rd * Math.cos((15 + 30 * k) * D), c[1] + Rd * Math.sin((15 + 30 * k) * D)]);
  const segs = [];
  for (const c of lattice(a, b, 4)) {
    const P = dodec(c); segs.push(...polygonEdges(P));
    for (const ang of [0, 60, 120]) { // komşu onikigene bakan kenarın uçlarını, komşunun karşı kenarının uçlarına bağla (kare)
      const n = [c[0] + S * Math.cos(ang * D), c[1] + S * Math.sin(ang * D)], Q = dodec(n);
      const mine = [ang - 15, ang + 15].map((t) => [c[0] + Rd * Math.cos(t * D), c[1] + Rd * Math.sin(t * D)]);
      const theirs = [ang + 180 + 15, ang + 180 - 15].map((t) => [n[0] + Rd * Math.cos(t * D), n[1] + Rd * Math.sin(t * D)]);
      segs.push([mine[0], theirs[0]], [mine[1], theirs[1]]);
      void Q;
    }
  }
  const tiles = tilesFromEdges(segs).filter((P) => Math.hypot(...centroid(P)) < 9);
  const kinds = new Set(tiles.map((P) => P.length));
  assert(kinds.has(12) && kinds.has(6) && kinds.has(4), "4.6.12 ağı: " + [...kinds].join(","));
  const faces = patternFaces(hankinLines(tiles, 60), 7.5);
  const col = (P) => (P.length === 24 ? COL.kobalt : P.length === 12 ? COL.firuze : P.length === 8 ? COL.hardal : P.length === 5 ? COL.kiremit : COL.beyaz);
  return pack(12, faces, (P) => P.length === 24, a, b, col);
}

const out = { _not: "build/gen_tani.mjs üretir; elle düzenleme. Koordinatlar yıldız dış yarıçapı = 1 biriminde.", families: [f6(), f8(), f10(), f12()] };
for (const f of out.families) {
  console.log(`${f.family}'lı: ${f.faces.length} yüz, ${f.stars.length} yıldız, uç ${f.tips} (${f.tipAngle}°), çentik ${f.notch}°, hücre ${f.cellArea}`);
  assert(f.tips === f.family, `${f.family}'lı yıldızın uç sayısı ${f.tips}`);
}
assert(out.families.find((f) => f.family === 8).notch === 135 && out.families.find((f) => f.family === 10).notch === 108 && out.families.find((f) => f.family === 6).notch === 120 && out.families.find((f) => f.family === 12).notch === 90, "çentik açıları");
writeFileSync(new URL("../data/tani.json", import.meta.url), JSON.stringify(out));
console.log("data/tani.json yazıldı,", Math.round(JSON.stringify(out).length / 1024), "KB");

// 10'lu ailenin kesin desenini (build/hankin.mjs) oyun verisine çevirir: yeni parçaların biçimi + her yüzün yerleşimi.
// Kullanım: node build/gen_levels10.mjs [çıktı.json]  → parça tanımları (gen_pieces.py'ye) ve birim hücre / yama yerleşimleri.
import { readFileSync, writeFileSync } from "node:fs";
import { hankin, centroid } from "./hankin.mjs";
import * as G from "../src/geometry.js";

const ROT = 18; // desen uçlarını oyundaki 10'lu yıldızın uçlarıyla (18° + 36°k) çakıştırır
const { a, b, faces } = hankin({ rot: ROT, range: 4, keep: 5.2 });
const { pieces } = JSON.parse(readFileSync(new URL("../data/pieces.json", import.meta.url), "utf8"));
const by = Object.fromEntries(pieces.map((p) => [p.id, p]));
const r6 = (v) => Math.round(v * 1e6) / 1e6 + 0;

/** Yüzü, parçanın (x, y, rot) yerleşimiyle eşleştir; yalnızca döndürme (aynalama yok). */
function placeAs(piece, F) {
  const c = centroid(F), lc = centroid(piece.points);
  for (let r = 0; r < 360; r += 6) {
    const rad = (r * Math.PI) / 180, rc = [lc[0] * Math.cos(rad) - lc[1] * Math.sin(rad), lc[0] * Math.sin(rad) + lc[1] * Math.cos(rad)];
    const pl = { x: c[0] - rc[0], y: c[1] - rc[1], rot: r };
    if (G.samePointSet(G.placedPoints(piece, pl), F, 2e-3)) return pl;
  }
  return null;
}
const kindOf = (F) => ({ 20: "on-kose-yildiz", 5: "besgen", 8: "papyon", 4: "dortgen-10" })[F.length];

// yeni parçaların yerel biçimi: örnek yüzün ağırlık merkezine göre; uzun ekseni yataya çevrilir
function localShape(F) {
  const c = centroid(F);
  let P = F.map(([x, y]) => [x - c[0], y - c[1]]);
  // en uzun köşegen yatay olsun
  let best = 0, ang = 0;
  for (const p of P) for (const q of P) { const d = G.dist(p, q); if (d > best) { best = d; ang = Math.atan2(q[1] - p[1], q[0] - p[0]); } }
  const r = -ang;
  P = P.map(([x, y]) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]);
  return P.map(([x, y]) => [r6(x), r6(y)]);
}
const sample = (n) => faces.filter((F) => F.length === n).sort((p, q) => Math.hypot(...centroid(p)) - Math.hypot(...centroid(q)))[0];
const newPieces = {
  papyon: { id: "papyon", family: 10, role: "köprü", points: localShape(sample(8)) },
  "dortgen-10": { id: "dortgen-10", family: 10, role: "dolgu", points: localShape(sample(4)) },
};
newPieces.papyon.angles = G.interiorAngles(newPieces.papyon.points);
newPieces["dortgen-10"].angles = G.interiorAngles(newPieces["dortgen-10"].points);
const lib = { ...by, ...newPieces };

// her yüz için yerleşim; eşleşmeyen (ayna gerektiren) yüz var mı?
const placed = [], mirrorNeeded = new Set();
for (const F of faces) {
  const id = kindOf(F); if (!id) { console.log("tanınmayan yüz", F.length); continue; }
  const pl = placeAs(lib[id], F);
  if (!pl) { mirrorNeeded.add(id); continue; }
  placed.push({ pieceId: id, x: r6(pl.x), y: r6(pl.y), rot: pl.rot, c: centroid(F) });
}
console.log("ayna gerektiren:", [...mirrorNeeded].join(", ") || "yok");

// birim hücre: ağırlık merkezi s·a + t·b, s, t ∈ [−½, ½) olan yüzler (yıldız orijinde)
const det = a[0] * b[1] - a[1] * b[0];
const st = ([x, y]) => [(x * b[1] - y * b[0]) / det, (a[0] * y - a[1] * x) / det];
const inCell = (c) => { const [s, t] = st(c); return s >= -0.5 - 1e-9 && s < 0.5 - 1e-9 && t >= -0.5 - 1e-9 && t < 0.5 - 1e-9; };
const cell = placed.filter((p) => inCell(p.c));
const count = (list) => list.reduce((m, p) => ((m[p.pieceId] = (m[p.pieceId] || 0) + 1), m), {});
console.log("birim hücre:", count(cell), " a =", a.map(r6), " b =", b.map(r6));
for (const p of Object.values(newPieces)) console.log(p.id, "açılar", p.angles.join("/"), "kenar", [...new Set(p.points.map((q, i) => Math.round(G.dist(q, p.points[(i + 1) % p.points.length]) * 1e4) / 1e4))].join(", "));

// ---- seviye bölgeleri ----
const pts = (p) => G.placedPoints(lib[p.pieceId], p);
const shares = (p, q, n = 1) => { const Q = pts(q); return pts(p).filter((u) => Q.some((v) => G.dist(u, v) < 1e-3)).length >= n; };
const starAt = (x, y) => placed.find((p) => p.pieceId === "on-kose-yildiz" && Math.hypot(p.x - x, p.y - y) < 1e-3);
const clean = ({ c, ...p }) => p;
const S0 = starAt(0, 0), SA = starAt(a[0], a[1]), SB = starAt(-b[0], -b[1]), SAB = starAt(a[0] - b[0], a[1] - b[1]);

// 2) papyon köprüsü: eşkenar dörtgenin köşelerindeki dört yıldız; ortadaki boşluk = en az iki yıldıza değen, ağırlık merkezi dörtgenin içinde olan parçalar
const quad = [S0, SA, SAB, SB].map((s) => [s.x, s.y]);
const inQuad = (c) => G.pointInPolygon(c, quad);
const bridge = placed.filter((p) => p.pieceId !== "on-kose-yildiz" && inQuad(p.c) && [S0, SA, SB, SAB].filter((s) => shares(p, s)).length >= 2);

// 3) ötele ve kapla: bağlantılı birim hücre (yıldız + kenarla komşulardan, her öteleme sınıfından bir temsilci)
const frac = (v) => ((v % 1) + 1) % 1;
const cls = (p) => { const [s, t] = st(p.c); return `${p.pieceId}:${frac(s + 1e-6).toFixed(3)}:${frac(t + 1e-6).toFixed(3)}`; };
const need = new Set(cell.map(cls)), unit = [S0], have = new Set([cls(S0)]);
const byDist = placed.filter((p) => p !== S0).sort((p, q) => Math.hypot(...p.c) - Math.hypot(...q.c));
for (let grew = true; have.size < need.size && grew; ) {
  grew = false;
  for (const p of byDist) { const k = cls(p); if (have.has(k) || !unit.some((q) => shares(p, q, 2))) continue; unit.push(p); have.add(k); grew = true; break; }
}

// 4) bozuk çini: merkez yıldız + kenarla komşuları + onların arasındaki dörtgenler; eksikler: yıldız, bir papyon, bir beşgen, bir dörtgen
const patch = placed.filter((p) => Math.hypot(...p.c) < 1.75);
const ring = patch.filter((p) => p !== S0 && shares(p, S0, 2));
const missing = [S0, ring.find((p) => p.pieceId === "papyon"), ring.find((p) => p.pieceId === "besgen"), patch.find((p) => p.pieceId === "dortgen-10")];

// metinlerde kullanılan açı ilişkilerini doğrula: papyonun köşelerinde neler buluşuyor?
const P0 = bridge.find((p) => p.pieceId === "papyon");
const around = G.evaluateVertices(placed.filter((p) => Math.hypot(p.c[0] - P0.c[0], p.c[1] - P0.c[1]) < 2.5).map((p) => ({ piece: lib[p.pieceId], placement: p })));
for (const q of pts(P0)) {
  const v = around.find((v) => G.dist(v.vertex, q) < 1e-3);
  console.log("papyon köşesi:", v.parts.map((pt) => `${placed.filter((p) => Math.hypot(p.c[0] - P0.c[0], p.c[1] - P0.c[1]) < 2.5)[pt.pieceIndex].pieceId} ${Math.round(pt.angle)}`).join(" + "), "=", Math.round(v.total));
}
console.log("köprü:", count(bridge), " hücre:", count(unit), " yama:", count(patch), " eksik:", missing.map((p) => p.pieceId).join(", "));

const out = {
  rot: ROT, a: a.map(r6), b: b.map(r6), newPieces,
  levels: {
    bridge: { fixed: [S0, SA, SAB, SB].map(clean), targets: bridge.map(clean) },
    cell: { fixed: unit.map(clean), translation: { a: a.map(r6), b: b.map(r6) } },
    broken: { fixed: patch.filter((p) => !missing.includes(p)).map(clean), targets: missing.map(clean) },
  },
  cell: cell.map(clean), all: placed.map(({ c, ...p }) => ({ ...p, cx: r6(c[0]), cy: r6(c[1]) })),
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 1));

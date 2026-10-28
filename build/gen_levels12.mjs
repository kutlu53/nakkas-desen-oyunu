// 12'li ailenin pergel hazırlığını (f12-l0) ve "yıldızın çevresi" seviyesini (f12-l1) üretir.
// Kullanım: node build/gen_levels12.mjs çıktı.json → seviye nesneleri (data/levels.json'a eklenir).
// Kurulum: yarıçapla daire altıya bölünür; altı yardımcı daire "altı yaprak"ı çizer, yaprak uçlarından geçen çaplar daireyi on ikiye tamamlar;
// dörder atlayan dört eşkenar üçgen {12/4} yıldızını verir.
import { readFileSync, writeFileSync } from "node:fs";
import * as G from "../src/geometry.js";

const D = Math.PI / 180, r7 = (v) => Math.round(v * 1e7) / 1e7 + 0;
const { pieces } = JSON.parse(readFileSync(new URL("../data/pieces.json", import.meta.url), "utf8"));
const by = Object.fromEntries(pieces.map((p) => [p.id, p]));
const STAR = by["oniki-kose-yildiz"], SQ = by["kare-12"];
const assert = (c, m) => { if (!c) throw new Error("denetim: " + m); };

// ---- yıldızın on iki çentiğine kare: köşe çentikte, kenarlar yıldız kenarlarıyla hizalı ----
const scene = [{ piece: STAR, placement: { x: 0, y: 0, rot: 0 } }], squares = [];
for (const [i, ang] of STAR.angles.entries()) {
  if (ang < 180) continue;
  const T = STAR.points[i]; let best = null;
  for (let vi = 0; vi < 4 && !best; vi++) for (const r of G.alignmentRotations(SQ, vi, scene, T)) {
    const pl = G.placeVertexAt(SQ, vi, r, T);
    if (G.anyOverlap(SQ, pl, scene) === -1) { best = pl; break; }
  }
  assert(best, "çentiğe kare");
  scene.push({ piece: SQ, placement: best });
  squares.push({ pieceId: "kare-12", x: r7(best.x), y: r7(best.y), rot: Math.round(G.norm360(best.rot) * 1000) / 1000, notch: T });
}
const vs = G.evaluateVertices(scene);
assert(vs.filter((v) => v.state === "tam").length === 12 && vs.every((v) => v.state !== "cakisma"), "12 çentik tam, çakışma yok");
const rots = [...new Set(squares.map((s) => G.norm360(Math.round(s.rot)) % 90))];
console.log("kare dönmeleri (mod 90):", rots.join(", "), "— R 30° adımla:", rots.every((r) => r % 30 === 0) ? "ulaşılır" : "ULAŞILAMAZ");

// ---- kurulum noktaları ----
const P = (k, R = 1, base = -90, step = 30) => [r7(R * Math.cos((base + step * k) * D)), r7(R * Math.sin((base + step * k) * D))];
const name = (k) => (k === 0 ? "A" : k === 6 ? "C" : String(k));
const points = { O: [0, 0] };
for (let k = 0; k < 12; k++) points[name(k)] = P(k);
const petals = ["p", "q", "r", "s", "t", "u"];
petals.forEach((n, k) => { points[n] = P(k, Math.sqrt(3), -60, 60); });
const tri = (ks) => ks.map((k, i) => ({ seg: [name(k), name(ks[(i + 1) % ks.length])] }));
const guide = squares.find((s) => Math.abs(Math.atan2(s.notch[1], s.notch[0]) / D + 75) < 1); // A ile 1 arasındaki çentik

const construct = {
  id: "f12-l0", family: 12, order: 0, title: "Pergelle kur",
  story: "Usta: 'Kubbe eteğindeki yıldız on iki kollu. Önce altıya böl, sonra her parçayı ikiye; pergel ikisini de yapar.'",
  tool: "construct",
  _not: "build/gen_levels12.mjs üretir. Altı yardımcı daire (merkezleri altı köşede, yarıçap = 1) ikişer ikişer p…u noktalarında kesişir (uzaklık √3); bu noktalardan geçen çaplar 30°'lik ara köşeleri verir. tests/geometry.tests.js her açılan noktanın iki çizimin kesişimi olduğunu denetler.",
  view: [-2.7, -2.05, 5.4, 4.05],
  points, start: ["O", "A"],
  steps: [
    { tool: "pergel", title: "Ana daire", pick: ["O", "A"], draw: [{ circle: ["O", "A"] }], say: "Pergelin sivri ucunu merkez O'ya koy, kalemini A'ya kadar aç ve daireyi çiz.", done: "Ana daire hazır. Pergelin açıklığını değiştirme." },
    { tool: "pergel", title: "Yürüt", pick: ["A", "O"], draw: [{ arc: ["A", "O"] }], reveals: ["2", "10"], say: "Aynı açıklıkla: ucu A'ya koy, kalem O'dan geçsin; daireyi iki yanda kes.", done: "Yay daireyi 2 ve 10'da kesti." },
    { tool: "pergel", title: "Yürüt", pick: ["2", "A"], draw: [{ arc: ["2", "A"] }, { arc: ["10", "A"] }], reveals: ["4", "8"], say: "Pergeli yürüt: ucu 2'ye koy, aynı açıklıkla yay çiz.", done: "10'dan da çizildi: 4 ve 8 bulundu." },
    { tool: "pergel", title: "Altıya böl", pick: ["4", "2"], draw: [{ arc: ["4", "2"] }, { arc: ["8", "10"] }], reveals: ["C"], say: "Bir kez daha: ucu 4'e koy, aynı açıklıkla yay çiz.", done: "8'den gelen yayla C'de buluştu: daire altıya bölündü." },
    { tool: "pergel", title: "Altı yaprak", pick: ["A", "O"], draw: ["A", "2", "4", "C", "8", "10"].map((c) => ({ circle: [c, "O"] })), reveals: petals,
      say: "Şimdi altı köşenin her birinden, aynı açıklıkla tam daire çiz: ucu A'ya koy, kalem O'dan geçsin.",
      done: "Altı daire çizildi: altı yapraklı gül. Komşu dairelerin dış kesişimleri p, q, r, s, t, u." },
    { tool: "cetvel", title: "Ara köşeler", pick: ["p", "O"], draw: [{ line: ["p", "O"] }, { line: ["q", "O"] }, { line: ["r", "O"] }], reveals: ["1", "7", "3", "9", "5", "11"],
      say: "Cetveli p ile O'ya daya; çizgiyi karşı yaprağa kadar uzat.",
      done: "q ve r'den de çizildi. Çaplar altı parçanın her birini ikiye böldü: daire on iki eşit parçada." },
    { tool: "cetvel", title: "Çift üçgenler", pick: ["A", "4"], draw: [...tri([0, 4, 8]), ...tri([2, 6, 10])], say: "Dörder atlayarak birleştir: A'dan 4'e çiz.", done: "A–4–8 ve 2–C–10 üçgenleri çizildi." },
    { tool: "cetvel", title: "Tek üçgenler", pick: ["1", "5"], draw: [...tri([1, 5, 9]), ...tri([3, 7, 11])], say: "Arada kalan köşeleri de dörder atlayarak birleştir: 1'den 5'e çiz.", done: "1–5–9 ve 3–7–11 üçgenleri de çizildi. Dört üçgenin birleşimi on iki köşeli yıldızı verir." },
    { tool: "boya", title: "Yıldızı boya", pick: ["O"], say: "Dört üçgenin birleştiği yıldızın içine dokun, boya.", done: "Yıldız çıktı." },
  ],
  finale: { fill: "oniki-kose-yildiz", ghost: { pieceId: "kare-12", x: guide.x, y: guide.y, rot: guide.rot }, notch: guide.notch.map(r7), notchLabel: "90°",
    say: "Yıldızın çentiği 90° — dik açı, ölçmeden çıktı. Kesikli çizgi kare: köşesi çentiğe tam oturuyor." },
  hint: { ortaokul: "Önce noktadan başla: pergelin ucu da cetvelin kenarı da bir noktaya dayanır." },
  discovery: "Daireyi önce yarıçapla altıya böldün, sonra altı yardımcı dairenin kesişimlerinden geçen çaplarla her parçayı ikiye: on iki eşit parça. Dörder atlayarak dört eşkenar üçgen çizince on iki köşeli yıldız ve çentiğindeki 90° kendiliğinden çıktı. Sonraki seviyede bu çentiklere kare yerleştireceksin.",
};
const level1 = {
  id: "f12-l1", family: 12, order: 1, title: "Yıldızın çevresi",
  story: "Usta: 'Kubbe eteğinin yıldızı on iki kollu. Çentiğine hangi taş oturur? Dene, açıya bak.'",
  _not: "build/gen_levels12.mjs. Kare kenarı = yıldız kenarı (S12); çentikte 270 + 90 = 360, uçlarda 60 + 90 + 90 = 240.",
  fixed: [{ pieceId: "oniki-kose-yildiz", x: 0, y: 0, rot: 0 }],
  tray: { "kare-12": 12 },
  trayDistractors: { ortaokul: { "ucgen-12": 2 }, lise: { "ucgen-12": 2, besgen: 1, hac: 1 } },
  targets: squares.map(({ notch, ...s }) => ({ ...s, rot: Math.round(s.rot) })),
  hint: { ortaokul: "Yıldızın çentiği 90° boşluk bırakır (360 − 270). Hangi parçanın köşesi dik açı? Üçgen 60° ile 30° açık bırakır.", lise: "Çentikteki boşluğu hesapla: 360 − iç açı." },
  discovery: "Çentik 90°: karenin köşesi tam oturur, 270 + 90 = 360. Üçgen 60° ile 30° açık bırakır. On iki kare yıldızı çevreler; uçlarda 60 + 90 + 90 = 240 toplanır, kalan 120° bir sonraki halkanın işidir.",
};
// üçgen gerçekten 30° açık bırakıyor mu (metindeki iddia)?
{
  const TRI = by["ucgen-12"], T = squares[0].notch; let okTri = false;
  for (let vi = 0; vi < 3 && !okTri; vi++) for (const r of G.alignmentRotations(TRI, vi, [scene[0]], T)) {
    const pl = G.placeVertexAt(TRI, vi, r, T);
    if (G.anyOverlap(TRI, pl, [scene[0]]) === -1 && G.evaluateVertices([scene[0], { piece: TRI, placement: pl }]).some((v) => Math.abs(v.total - 330) < 0.5)) okTri = true;
  }
  assert(okTri, "üçgen çentikte 330");
}
// ---- 3.4.6.4 Arşimet döşemesi (altıgen, kare, üçgen; kenar = S12): her köşede 60 + 90 + 120 + 90 ----
const HEX = by["altigen-12"], TRI = by["ucgen-12"], s = G.dist(HEX.points[0], HEX.points[1]);
const L = s * (1 + Math.sqrt(3)); // iki altıgen merkezi arası (aralarında bir kare)
const hexNormals = [...Array(6)].map((_, k) => Math.atan2(...[1, 0].map((_, j) => { const p = HEX.points[k], q = HEX.points[(k + 1) % 6]; return j === 0 ? (p[1] + q[1]) / 2 : (p[0] + q[0]) / 2; })));
const la = [L * Math.cos(hexNormals[0]), L * Math.sin(hexNormals[0])], lb = [L * Math.cos(hexNormals[1]), L * Math.sin(hexNormals[1])];
/** Verilen köşeleri tutan parçanın (x, y, rot) yerleşimi; dönme 30°'nin katı olmalı. */
function placeFace(piece, pts) {
  const c = [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length];
  const lc = [piece.points.reduce((t, p) => t + p[0], 0) / piece.points.length, piece.points.reduce((t, p) => t + p[1], 0) / piece.points.length];
  for (let r = 0; r < 360; r += 30) {
    const rad = r * D, rc = [lc[0] * Math.cos(rad) - lc[1] * Math.sin(rad), lc[0] * Math.sin(rad) + lc[1] * Math.cos(rad)];
    const pl = { pieceId: piece.id, x: r7(c[0] - rc[0]), y: r7(c[1] - rc[1]), rot: r };
    if (G.samePointSet(G.placedPoints(piece, pl), pts, 2e-3)) return pl;
  }
  throw new Error(`${piece.id} 30°'nin katlarıyla yerleşmiyor`);
}
// aynı yüz birden çok altıgenden hesaplanır: aynı tür ve ağırlık merkezleri 0,01'den yakınsa tek sayılır
// (parça köşeleri 4 basamağa yuvarlı olduğundan koordinatlar ~1e-4 kayar; üçgenin yerel orijini kutu ortası olduğundan x, y değil merkez karşılaştırılır)
const tiles = [], centers = [];
const put = (pl) => {
  const c = G.centroid(G.placedPoints(by[pl.pieceId], pl));
  if (tiles.some((t, i) => t.pieceId === pl.pieceId && G.dist(centers[i], c) < 1e-2)) return;
  tiles.push(pl); centers.push(c);
};
for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
  const c = [i * la[0] + j * lb[0], i * la[1] + j * lb[1]];
  if (Math.hypot(...c) > 6) continue;
  const H = G.placedPoints(HEX, { x: c[0], y: c[1], rot: 0 });
  put({ pieceId: HEX.id, x: r7(c[0]), y: r7(c[1]), rot: 0 });
  for (let k = 0; k < 6; k++) {
    const p = H[k], q = H[(k + 1) % 6], n = [Math.cos(hexNormals[k]), Math.sin(hexNormals[k])];
    put(placeFace(SQ, [p, q, [q[0] + n[0] * s, q[1] + n[1] * s], [p[0] + n[0] * s, p[1] + n[1] * s]]));        // kenara kare
    const m = [Math.cos(hexNormals[(k + 5) % 6]), Math.sin(hexNormals[(k + 5) % 6])];                            // köşede üçgen: iki karenin arasında
    put(placeFace(TRI, [p, [p[0] + m[0] * s, p[1] + m[1] * s], [p[0] + n[0] * s, p[1] + n[1] * s]]));
  }
}
const scT = (list) => list.map((p) => ({ piece: by[p.pieceId], placement: p }));
const near = (r) => tiles.filter((p) => Math.hypot(p.x, p.y) < r);
const vT = G.evaluateVertices(scT(near(2.5)));
assert(vT.every((v) => v.state !== "cakisma") && near(2.5).every((p, i, arr) => G.anyOverlap(by[p.pieceId], p, scT(arr.filter((_, j) => j !== i))) === -1), "3.4.6.4 çakışmasız");
assert(vT.filter((v) => v.state === "tam").every((v) => v.parts.map((pt) => Math.round(pt.angle)).sort().join() === "120,60,90,90"), "her tam köşe 60 + 90 + 120 + 90");
const at0 = (p) => Math.hypot(p.x, p.y) < 1e-6;
const ringAround = tiles.filter((p) => !at0(p) && G.placedPoints(by[p.pieceId], p).some((q) => G.placedPoints(HEX, { x: 0, y: 0, rot: 0 }).some((h) => G.dist(h, q) < 1e-3)));
const clean = (list) => list.map(({ pieceId, x, y, rot }) => ({ pieceId, x, y, rot }));
const count = (list) => list.reduce((m, p) => ((m[p.pieceId] = (m[p.pieceId] || 0) + 1), m), {});
assert(count(ringAround)["kare-12"] === 6 && count(ringAround)["ucgen-12"] === 6, "altıgenin çevresi 6 kare + 6 üçgen");
// birim hücre: altıgen + kenarla komşu karelerden ve üçgenlerden, her öteleme sınıfından bir temsilci
const det = la[0] * lb[1] - la[1] * lb[0];
const frac = (v) => ((v % 1) + 1) % 1;
const cls = (p) => { const s1 = (p.x * lb[1] - p.y * lb[0]) / det, t1 = (la[0] * p.y - la[1] * p.x) / det; return `${p.pieceId}:${frac(s1 + 1e-6).toFixed(3)}:${frac(t1 + 1e-6).toFixed(3)}`; };
const need = new Set(tiles.filter((p) => Math.hypot(p.x, p.y) < 4).map(cls));
const unit = [tiles.find(at0)], have = new Set([cls(unit[0])]);
for (const p of [...ringAround].sort((x, y) => Math.hypot(x.x, x.y) - Math.hypot(y.x, y.y))) { const k = cls(p); if (!have.has(k)) { unit.push(p); have.add(k); } }
assert(have.size === need.size, `birim hücre ${have.size}/${need.size}`);
const cellArea = unit.reduce((t, p) => t + Math.abs(G.signedArea(by[p.pieceId].points)), 0);
assert(Math.abs(cellArea - Math.abs(det)) < 1e-3, "hücre alanı");
// bozuk çini: merkez altıgen, çevresi ve komşu altıgenler; eksikler: merkez altıgen, bir kare, bir üçgen (ayrı yerlerden)
const patch = tiles.filter((p) => Math.hypot(p.x, p.y) < s * 3.2);
const sqMiss = ringAround.find((p) => p.pieceId === "kare-12");
const triMiss = ringAround.filter((p) => p.pieceId === "ucgen-12").sort((x, y) => Math.hypot(y.x - sqMiss.x, y.y - sqMiss.y) - Math.hypot(x.x - sqMiss.x, x.y - sqMiss.y))[0]; // kareden en uzak üçgen
const missing = [tiles.find(at0), sqMiss, triMiss];

const level2 = {
  id: "f12-l2", family: 12, order: 2, title: "Onikigen",
  story: "Usta: 'Altıgenin her kenarına bir kare, her köşesine bir üçgen. Bitince bak: elinde ne kaldı?'",
  _not: "build/gen_levels12.mjs. 3.4.6.4 Arşimet döşemesinin bir halkası: altıgen + 6 kare + 6 üçgen = kenarı S12 olan düzgün onikigen. Her iç köşede 60 + 90 + 120 + 90 = 360.",
  fixed: [{ pieceId: "altigen-12", x: 0, y: 0, rot: 0 }],
  tray: { "kare-12": 6, "ucgen-12": 6 }, trayDistractors: { lise: { besgen: 1, "kare-kucuk": 1 } },
  targets: clean(ringAround),
  hint: { ortaokul: "Önce altıgenin her kenarına bir kare koy. Altıgenin köşesinde 120 + 90 + 90 = 300 olur; kalan 60° bir üçgen.", lise: "Altıgenin köşesinde iki kare buluşunca kaç derece kalıyor?" },
  discovery: "Her köşede aynı sıra: üçgen, kare, altıgen, kare — 60 + 90 + 120 + 90 = 360. Altıgen, altı kare ve altı üçgen birleşince düzgün bir onikigen oldu: 12'li ailenin adı buradan gelir. Bu döşeme, her köşesi aynı olduğu için bir Arşimet döşemesidir (3.4.6.4).",
};
const level3 = {
  id: "f12-l3", family: 12, order: 3, title: "Ötele ve kapla",
  story: "Usta: 'Onikigenleri yan yana koyamazsın, arada boşluk kalır. Birimi bul: bir altıgen, üç kare, iki üçgen.'",
  _not: `build/gen_levels12.mjs. Birim hücre: ${Object.entries(count(unit)).map(([k, v]) => `${v} ${k}`).join(", ")} (alan = |a × b|). Kafes |a| = |b| = kenar · (1 + √3), aralarında 60°.`,
  fixed: clean(unit), tray: {}, tool: "translate-copy", translation: { a: la.map(r7), b: lb.map(r7) }, gridSize: { ortaokul: 2, lise: 3 }, targets: [],
  hint: { ortaokul: "Birim hücre: bir altıgen, üç kare, iki üçgen. Kopyayı, karesi komşu altıgenin kenarına değecek şekilde koy.", lise: "Öteleme vektörü iki komşu altıgenin merkezini birleştirir; arada tam bir kare var. Uzunluğu kaç kenar eder?" },
  discovery: "Birim hücre bir altıgen, üç kare ve iki üçgendir. İki altıgenin arası bir kare kadar açılır, bu yüzden öteleme vektörü kenarın 1 + √3 katıdır. Ötelenen her hücre, her köşede yine 60 + 90 + 120 + 90 = 360 verir.",
};
const level4 = {
  id: "f12-l4", family: 12, order: 4, title: "Bozuk çini",
  story: "Usta: 'Kubbe eteğinden üç çini düşmüş. Kutuda benzerleri var; açısına bak.'",
  _not: "build/gen_levels12.mjs. 3.4.6.4 yaması; eksikler: merkez altıgen, bir kare, bir üçgen.",
  fixed: clean(patch.filter((p) => !missing.includes(p))),
  tray: count(missing), trayDistractors: { ortaokul: { besgen: 1 }, lise: { besgen: 1, altigen: 1, "kare-kucuk": 1 } },
  targets: clean(missing),
  hint: { ortaokul: "Her boşluğun bir köşesine bak: kaç derece kalmış? 60 mı, 90 mı, 120 mi?", lise: "Boşluğun köşelerindeki açıyı hesapla. Aynı açılı ama farklı boyda parça da var; kenar boyuna da bak." },
  discovery: "Her köşe aynı: 60 + 90 + 120 + 90 = 360. Eksik parçayı köşedeki açıdan buldun. Beşgenin 108°'si bu köşelere uymaz; 6'lı ailenin altıgeni aynı açılı ama daha büyüktür, komşularına biner.",
};
console.log("3.4.6.4: halka", JSON.stringify(count(ringAround)), "hücre", JSON.stringify(count(unit)), "yama", patch.length, "eksik", missing.map((p) => p.pieceId).join(","),
  "| dönmeler:", [...new Set(tiles.map((p) => `${p.pieceId}@${p.rot % ({ "kare-12": 90, "ucgen-12": 120, "altigen-12": 60 })[p.pieceId]}`))].join(" "));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify([construct, level1, level2, level3, level4], null, 1));
console.log("12'li: f12-l0", construct.steps.length, "adım; f12-l1", level1.targets.length, "kare; f12-l2..l4");

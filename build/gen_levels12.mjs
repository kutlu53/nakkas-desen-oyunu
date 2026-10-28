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
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify([construct, level1], null, 1));
console.log("12'li: f12-l0", construct.steps.length, "adım; f12-l1", level1.targets.length, "kare");

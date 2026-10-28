// 6'lı ailenin kesin desenini (altı köşeli yıldızlar uç uca, aralarında altıgenler) Kur seviyelerine çevirir.
// Kullanım: node build/gen_levels6.mjs çıktı.json → f6-l0..l4 seviye nesneleri (data/levels.json'a eklenir).
// Kafes: a = (√3, 1), b = (0, 2); yıldızlar kafes noktalarında, altıgenler her kafes üçgeninin ortasında.
import { readFileSync, writeFileSync } from "node:fs";
import * as G from "../src/geometry.js";

const D = Math.PI / 180, r7 = (v) => Math.round(v * 1e7) / 1e7 + 0;
const { pieces } = JSON.parse(readFileSync(new URL("../data/pieces.json", import.meta.url), "utf8"));
const by = Object.fromEntries(pieces.map((p) => [p.id, p]));
const STAR = by["alti-kose-yildiz"], HEX = by.altigen;
const a = [Math.sqrt(3), 1], b = [0, 2];
const add = (p, q, k = 1) => [p[0] + k * q[0], p[1] + k * q[1]];
const assert = (c, m) => { if (!c) throw new Error("denetim: " + m); };

/** Altıgeni (cx, cy) merkezine, bir köşesi yıldıza bakacak biçimde koy; parçanın yerel biçimine uyan dönmeyi bul. */
function hexAt(c, toward) {
  const phi = Math.atan2(toward[1] - c[1], toward[0] - c[0]), R = Math.hypot(...HEX.points[0]);
  const want = Array.from({ length: 6 }, (_, k) => [c[0] + R * Math.cos(phi + k * 60 * D), c[1] + R * Math.sin(phi + k * 60 * D)]);
  for (let r = 0; r < 60; r += 6) if (G.samePointSet(G.placedPoints(HEX, { x: c[0], y: c[1], rot: r }), want, 2e-3)) return { pieceId: "altigen", x: r7(c[0]), y: r7(c[1]), rot: r };
  throw new Error("altıgen dönmesi bulunamadı");
}
const star = (c) => ({ pieceId: "alti-kose-yildiz", x: r7(c[0]), y: r7(c[1]), rot: 0 });
// üçgen (p, q, s) ortasındaki altıgen
const hexIn = (p, q, s) => hexAt([(p[0] + q[0] + s[0]) / 3, (p[1] + q[1] + s[1]) / 3], p);

// ---- tam desen (doğrulama için) ----
const lat = []; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) lat.push(add([i * a[0], i * a[1]], b, j));
const full = [...lat.map(star), ...lat.flatMap((c) => [hexIn(c, add(c, a), add(c, b)), hexIn(c, add(c, b), add(add(c, b), a, -1))])];
const sc = (list) => list.map((p) => ({ piece: by[p.pieceId], placement: p }));
const nearFull = full.filter((p) => Math.hypot(p.x, p.y) < 3.2);
const vs = G.evaluateVertices(sc(nearFull));
assert(vs.every((v) => v.state !== "cakisma"), "tam desende çakışma");
assert(nearFull.every((p, i) => G.anyOverlap(by[p.pieceId], p, sc(nearFull.filter((_, j) => j !== i))) === -1), "parça çakışması");

const O = [0, 0], A = a, B = b, AB = add(a, b, -1); // b − a yerine: üçgen 0, a, b ve 0, b, b − a
// 1) yıldızın çevresi: altı çentiğe altı altıgen
const ring = [hexIn(O, A, B), hexIn(O, B, add(B, A, -1)), hexIn(O, add(B, A, -1), add(O, A, -1)), hexIn(O, add(O, A, -1), add(O, B, -1)), hexIn(O, add(O, B, -1), add(A, B, -1)), hexIn(O, add(A, B, -1), A)];
// 2) petek: uç uca üç yıldız (0, a, b); ortadaki altıgen + çift yıldıza değen üç altıgen
const trio = [O, A, B];
const petek = [hexIn(O, A, B), hexIn(O, A, add(A, B, -1)), hexIn(A, B, add(A, B)), hexIn(O, B, add(B, A, -1))];
// 3) ötele ve kapla: yıldız + iki altıgen
const cell = [star(O), hexIn(O, A, B), hexIn(O, B, add(B, A, -1))];
// 4) bozuk çini: merkez yıldız ve çevresi; eksikler: merkez yıldız, iki altıgen
const patch = full.filter((p) => Math.hypot(p.x, p.y) < 2.05);
// eksik altıgenler yan uçlarda (0° ve 180°): üst ve alt uçlar kapalı kalır, yanlış yıldız 60°'lik boşlukla açıklanır
const missing = [patch.find((p) => p.pieceId === "alti-kose-yildiz" && Math.hypot(p.x, p.y) < 1e-6), ring[2], ring[5]].map((m) => patch.find((p) => p.pieceId === m.pieceId && Math.hypot(p.x - m.x, p.y - m.y) < 1e-6));
assert(missing.every(Boolean), "eksikler yamada");
void AB;

// ---- 0) pergel hazırlığı: yarıçap çevreye altı kez sığar ----
const notch = [r7(STAR.points[1][0]), r7(STAR.points[1][1])]; // A ile 1 arasındaki çentik
const guide = ring.find((h) => G.placedPoints(HEX, h).some((q) => G.dist(q, notch) < 1e-3));
const pt = (k) => [r7(Math.cos((-90 + 60 * k) * D)), r7(Math.sin((-90 + 60 * k) * D))];
const points = { O: [0, 0], A: pt(0), "1": pt(1), "2": pt(2), C: pt(3), "4": pt(4), "5": pt(5) };
const construct = {
  id: "f6-l0", family: 6, order: 0, title: "Pergelle kur",
  story: "Usta: 'Altı kollu yıldız en kolayıdır: pergelin açıklığını hiç bozma, dairenin üstünde yürüt.'",
  tool: "construct",
  _not: "build/gen_levels6.mjs üretir. Yarıçap kadar açılmış pergel, çevre üzerinde altı kez yürütülünce daire altıya bölünür (her kiriş = yarıçap). tests/geometry.tests.js her açılan noktanın iki çizimin kesişimi olduğunu denetler.",
  view: [-2.4, -2.05, 4.8, 3.6].map(r7),
  points, start: ["O", "A"],
  steps: [
    { tool: "pergel", title: "Ana daire", pick: ["O", "A"], draw: [{ circle: ["O", "A"] }], say: "Pergelin sivri ucunu merkez O'ya koy, kalemini A'ya kadar aç ve daireyi çiz.", done: "Ana daire hazır. Pergelin açıklığını artık değiştirme." },
    { tool: "pergel", title: "İlk yay", pick: ["A", "O"], draw: [{ arc: ["A", "O"] }], reveals: ["1", "5"], say: "Aynı açıklıkla: ucu A'ya koy, kalem O'dan geçsin; daireyi iki yanda kes.", done: "Yay daireyi 1 ve 5'te kesti. A ile 1 arası tam bir yarıçap." },
    { tool: "pergel", title: "Yürüt", pick: ["1", "A"], draw: [{ arc: ["1", "A"] }, { arc: ["5", "A"] }], reveals: ["2", "4"], say: "Pergeli yürüt: ucu 1'e koy, aynı açıklıkla yay çiz.", done: "5'ten de çizildi: 2 ve 4 bulundu." },
    { tool: "pergel", title: "Son köşe", pick: ["2", "1"], draw: [{ arc: ["2", "1"] }, { arc: ["4", "5"] }], reveals: ["C"], say: "Bir kez daha: ucu 2'ye koy, aynı açıklıkla yay çiz.", done: "4'ten gelen yayla C'de buluştu. Yarıçap çevreye tam altı kez sığdı: daire altıya bölündü." },
    { tool: "cetvel", title: "Birinci üçgen", pick: ["A", "2"], draw: [{ seg: ["A", "2"] }, { seg: ["2", "4"] }, { seg: ["4", "A"] }], say: "Noktaları birer atlayarak birleştir: A'dan 2'ye çiz.", done: "2–4 ve 4–A da çizildi: birinci eşkenar üçgen." },
    { tool: "cetvel", title: "İkinci üçgen", pick: ["1", "C"], draw: [{ seg: ["1", "C"] }, { seg: ["C", "5"] }, { seg: ["5", "1"] }], say: "Arada kalan üç noktayı birleştir: 1'den C'ye çiz.", done: "İkinci üçgen de hazır. İki üçgenin birleşimi altı köşeli yıldızı verir." },
    { tool: "boya", title: "Yıldızı boya", pick: ["O"], say: "İki üçgenin birleştiği yıldızın içine dokun, boya.", done: "Yıldız çıktı." },
  ],
  finale: { fill: "alti-kose-yildiz", ghost: { pieceId: "altigen", x: guide.x, y: guide.y, rot: guide.rot }, notch, notchLabel: "120°",
    say: "Yıldızın çentiği 120° — ölçmeden çıktı. Kesikli çizgi altıgen: köşesi 120°, çentiğe tam oturuyor." },
  hint: { ortaokul: "Önce noktadan başla: pergelin ucu da cetvelin kenarı da bir noktaya dayanır." },
  discovery: "Pergelin açıklığını hiç değiştirmeden daireyi altıya böldün: yarıçap, çevrenin üstüne tam altı kez sığar. Birer atlayarak iki eşkenar üçgen çizdin; altı köşeli yıldız da çentiğindeki 120° de çizimden kendiliğinden çıktı. Sonraki seviyede bu çentiklere altıgen yerleştireceksin.",
};
// çentik etiketi gerçekten yıldızın bir çentiği ve kılavuz altıgen ona değiyor mu?
assert(STAR.angles[1] > 180 && guide, "kılavuz altıgen çentikte");

const clean = (list) => list.map(({ pieceId, x, y, rot }) => ({ pieceId, x, y, rot }));
const levels = [
  construct,
  { id: "f6-l1", family: 6, order: 1, title: "Yıldızın çevresi",
    story: "Usta: 'Hamamın kubbe deliklerine bak: altı kollu yıldız. Çentiğine hangi taş oturur?'",
    _not: "build/gen_levels6.mjs. Çentikte 240 + 120 = 360; uçlarda 60 + 120 + 120 = 300, kalan 60° komşu yıldızın ucu.",
    fixed: [star(O)], tray: { altigen: 6 }, trayDistractors: { ortaokul: { "kare-kucuk": 2 }, lise: { "kare-kucuk": 2, besgen: 2 } },
    targets: clean(ring),
    hint: { ortaokul: "Yıldızın çentiği 120° boşluk bırakır (360 − 240). Hangi parçanın 120° köşesi var?", lise: "Çentikteki boşluğu hesapla: 360 − iç açı." },
    discovery: "Çentik 120°: altıgenin köşesi tam oturur, 240 + 120 = 360. Altı altıgen yıldızı çevreler; uçlarda 60 + 120 + 120 = 300 toplanır, kalan 60° komşu yıldızın ucudur." },
  { id: "f6-l2", family: 6, order: 2, title: "Petek",
    story: "Usta: 'Üç yıldız uç uca değiyor. Aralarındaki boşluklar bal peteği gibi dolar.'",
    _not: "build/gen_levels6.mjs. Üç yıldızın ortasındaki altıgen üç çentiğe değer (240 + 120); uç uca değen iki yıldızın ucunda 60 + 60 + 120 + 120 = 360.",
    fixed: trio.map(star), tray: { altigen: 4 }, trayDistractors: { lise: { "on-kose-yildiz": 1, besgen: 1 } },
    targets: clean(petek),
    hint: { ortaokul: "Önce üç yıldızın tam ortasına bir altıgen koy: üç çentiğe birden değer. Sonra iki yıldızın arasındaki boşluklara.", lise: "Uç uca değen iki yıldızın ucunda kaç derece toplanıyor? Kalanı kim doldurur?" },
    discovery: "Ortadaki altıgen üç yıldızın çentiğine birden oturur: her birinde 240 + 120 = 360. İki yıldızın uç uca değdiği köşede 60 + 60 + 120 + 120 = 360. Altı köşeli yıldız ve altıgen, başka parça gerekmeden düzlemi kaplar." },
  { id: "f6-l3", family: 6, order: 3, title: "Ötele ve kapla",
    story: "Usta: 'Birimi buldun: bir yıldız, iki altıgen. Kopyala, duvar dolsun.'",
    _not: "Birim hücre: 1 yıldız + 2 altıgen (alan = |a × b| = 2√3). a = (√3, 1), b = (0, 2): aralarında 60°.",
    fixed: clean(cell), tray: {}, tool: "translate-copy", translation: { a: a.map(r7), b }, gridSize: { ortaokul: 2, lise: 3 }, targets: [],
    hint: { ortaokul: "Birim hücre: bir yıldız ve iki altıgen. Kopyayı, yıldız ucu komşu yıldızın ucuna değecek şekilde koy.", lise: "Öteleme vektörleri iki komşu yıldızın merkezini birleştirir. Aralarındaki açı kaç derece?" },
    discovery: "6'lı desenin birim hücresi 60°/120°'lik bir eşkenar dörtgendir: bir yıldız ve iki altıgen. Bu hücre ötelenince yıldızlar üçgen bir kafese dizilir; altıgenler de her üçgenin ortasına düşer." },
  { id: "f6-l4", family: 6, order: 4, title: "Bozuk çini",
    story: "Usta: 'Hamam duvarından üç çini düşmüş; ortadaki yıldız da gitmiş. Benzerlerine aldanma, açıya bak.'",
    _not: "build/gen_levels6.mjs. Yama: merkezden 2,05 birim içindeki parçalar; eksikler: merkez yıldız ve iki altıgen. 8'li ve 12'li yıldız aynı boyda ama sığmaz (tests/geometry.tests.js).",
    fixed: clean(patch.filter((p) => !missing.includes(p))),
    tray: { "alti-kose-yildiz": 1, altigen: 2 }, trayDistractors: { ortaokul: { "sekiz-kose-yildiz": 1, "kare-kucuk": 1 }, lise: { "sekiz-kose-yildiz": 1, "oniki-kose-yildiz": 1, besgen: 1 } },
    targets: clean(missing),
    hint: { ortaokul: "Üç yıldız aynı boyda. Boşluğun uçlarında kaç derece kalıyor: 60 mı, 90 mı?", lise: "Boşluğun bir köşesindeki açıyı hesapla; hangi yıldızın ucu ona eşit?" },
    discovery: "Ortadaki boşluk çentiklerinde 240° ister, uçlarında 60°. Bunu yalnızca 6'lı yıldız karşılar; 8'li yıldızın ucu 90°, 12'li yıldızınki 60° olsa da çentiği (270°) bu boşluğa uymaz." },
];
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(levels, null, 1));
console.log("6'lı:", levels.map((l) => `${l.id}(${(l.targets || []).length || l.steps?.length || l.fixed.length})`).join(" "), "| yama", patch.length, "parça");

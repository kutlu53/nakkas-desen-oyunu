// Girih ongen + papyon döşemesi üzerinde Hankin (54°) deseni: alt döşemeyi kur, her kenar ortasından 54° ışınlar çiz,
// çizgilerin böldüğü yüzleri çıkar. 10'lu ailenin kesin parçaları ve seviye hedefleri buradan türetilir (build/gen_levels10.mjs).
// Ölçek: ongen kenar-orta uzaklığı = 10'lu yıldızın dış yarıçapı = 1. Kafes: a, b (|a| = |b| = 2, aralarında 72°).
const D = Math.PI / 180, EPS = 1e-7;
const AP = 1;                                  // ongen kenar-orta uzaklığı = yıldız dış yarıçapı = 1
const E = 2 * AP * Math.tan(18 * D);           // ongen kenarı
const R = E / (2 * Math.sin(18 * D));          // ongen çevrel yarıçapı
const A = [2 * AP, 0], B = [2 * AP * Math.cos(72 * D), 2 * AP * Math.sin(72 * D)];

const key = ([x, y]) => `${Math.round(x * 1e5)},${Math.round(y * 1e5)}`;
const decagon = ([cx, cy], rr = 0) => Array.from({ length: 10 }, (_, k) => [cx + R * Math.cos((18 + 36 * k) * D + rr), cy + R * Math.sin((18 + 36 * k) * D + rr)]);

// ---- düzlemsel yüz çıkarma (doğru parçalarından) ----
function faces(segs) {
  // kesişimlerde böl
  const pts = segs.map(([a, b]) => [a, b]);
  const cuts = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const [p, p2] = segs[i], [q, q2] = segs[j];
    const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]];
    const den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-12) continue;
    const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den, u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den;
    if (t > -EPS && t < 1 + EPS && u > -EPS && u < 1 + EPS) { cuts[i].push(t); cuts[j].push(u); }
  }
  const V = new Map(), adj = new Map();
  const vid = (p) => { const k = key(p); if (!V.has(k)) { V.set(k, p); adj.set(k, new Set()); } return k; };
  segs.forEach(([a, b], i) => {
    const ts = [...new Set(cuts[i].map((t) => Math.round(t * 1e9) / 1e9))].sort((x, y) => x - y);
    for (let k = 0; k + 1 < ts.length; k++) {
      const P = [a[0] + (b[0] - a[0]) * ts[k], a[1] + (b[1] - a[1]) * ts[k]], Q = [a[0] + (b[0] - a[0]) * ts[k + 1], a[1] + (b[1] - a[1]) * ts[k + 1]];
      const u = vid(P), v = vid(Q); if (u !== v) { adj.get(u).add(v); adj.get(v).add(u); }
    }
  });
  // yarım kenar dolaşımı
  const ang = (u, v) => Math.atan2(V.get(v)[1] - V.get(u)[1], V.get(v)[0] - V.get(u)[0]);
  const sorted = new Map([...adj].map(([u, ns]) => [u, [...ns].sort((x, y) => ang(u, x) - ang(u, y))]));
  const used = new Set(), out = [];
  for (const [u, ns] of sorted) for (const v of ns) {
    if (used.has(u + ">" + v)) continue;
    const poly = []; let a = u, b = v, guard = 0;
    while (!used.has(a + ">" + b) && guard++ < 200) {
      used.add(a + ">" + b); poly.push(V.get(a));
      const list = sorted.get(b), i = list.indexOf(a);
      const c = list[(i - 1 + list.length) % list.length]; // en sağa dön → saat yönünün tersi yüz
      a = b; b = c;
    }
    out.push(poly);
  }
  return out;
}
export const area = (P) => P.reduce((s, p, i) => s + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0) / 2;
export const centroid = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
function simplify(P) { // düz köşeleri at
  return P.filter((p, i) => { const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length]; return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-6; });
}
export function angles(P) {
  return P.map((p, i) => {
    const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length];
    let t = Math.atan2(a[1] - p[1], a[0] - p[0]) - Math.atan2(b[1] - p[1], b[0] - p[0]);
    t = ((t / D) % 360 + 360) % 360; return area(P) > 0 ? 360 - t : t;
  });
}

// ---- 1) alt döşeme: ongenler kafeste, aradaki yüzler papyon ----
export function hankin({ rot = 0, range = 3, keep = 3.2 } = {}) {
  const rr = rot * D, rotp = ([x, y]) => [x * Math.cos(rr) - y * Math.sin(rr), x * Math.sin(rr) + y * Math.cos(rr)];
  const a = rotp(A), b = rotp(B);
  const centers = []; for (let i = -range; i <= range; i++) for (let j = -range; j <= range; j++) centers.push([i * a[0] + j * b[0], i * a[1] + j * b[1]]);
const decs = centers.map((c) => decagon(c, rr));
const edgeSegs = new Map();
for (const P of decs) P.forEach((p, i) => { const q = P[(i + 1) % 10]; const k = [key(p), key(q)].sort().join("|"); edgeSegs.set(k, [p, q]); });
const tilesAll = faces([...edgeSegs.values()]).map(simplify).filter((P) => area(P) > 1e-6);
const inWin = (c, r) => Math.hypot(c[0], c[1]) < r;
const tiles = tilesAll.filter((P) => inWin(centroid(P), keep + 2.5));
const tileKinds = {}; for (const P of tiles) { const k = `${P.length}:${angles(P).map((a) => Math.round(a)).join(",")}`; tileKinds[k] = (tileKinds[k] || 0) + 1; }


// ---- 2) Hankin: her kenar ortasından iki ışın, 54°; komşu kenarın ışınıyla buluşana dek ----
const THETA = 54 * D;
const pattern = [];
for (const P of tiles) {
  const n = P.length, ccw = area(P) > 0;
  const mid = (i) => [(P[i][0] + P[(i + 1) % n][0]) / 2, (P[i][1] + P[(i + 1) % n][1]) / 2];
  const ray = (i, towardNext) => { // kenar i'nin ortasından, i+1 köşesine (ya da i köşesine) doğru, içe 54°
    const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u = towardNext ? [(b[0] - a[0]) / L, (b[1] - a[1]) / L] : [(a[0] - b[0]) / L, (a[1] - b[1]) / L];
    const inward = ccw ? 1 : -1, s = towardNext ? inward : -inward;
    const c = Math.cos(THETA), sn = Math.sin(THETA) * s;
    return { o: mid(i), d: [u[0] * c - u[1] * sn, u[0] * sn + u[1] * c] };
  };
  // her ışın, kendisiyle en erken buluşan ışınla eşleşir (Hankin kuralı; içbükey köşelerde karşı ışınla buluşur)
  const rays = []; for (let i = 0; i < n; i++) rays.push(ray(i, true), ray(i, false));
  const meets = [];
  for (let p = 0; p < rays.length; p++) for (let q = p + 1; q < rays.length; q++) {
    const r1 = rays[p], r2 = rays[q];
    if (Math.hypot(r1.o[0] - r2.o[0], r1.o[1] - r2.o[1]) < 1e-9) continue; // aynı kenar ortası
    const den = r1.d[0] * r2.d[1] - r1.d[1] * r2.d[0];
    const wx = r2.o[0] - r1.o[0], wy = r2.o[1] - r1.o[1];
    if (Math.abs(den) < 1e-9) {
      // aynı doğru üstünde birbirine bakan ışınlar: kenar ortalarını birleştir
      const L = Math.hypot(wx, wy);
      if (Math.abs(wx * r1.d[1] - wy * r1.d[0]) < 1e-9 && wx * r1.d[0] + wy * r1.d[1] > 0 && wx * r2.d[0] + wy * r2.d[1] < 0) meets.push({ p, q, d: L / 2, T: null });
      continue;
    }
    const t = (wx * r2.d[1] - wy * r2.d[0]) / den, u = (wx * r1.d[1] - wy * r1.d[0]) / den;
    if (t > 1e-9 && u > 1e-9) meets.push({ p, q, d: Math.max(t, u), T: [r1.o[0] + r1.d[0] * t, r1.o[1] + r1.d[1] * t] });
  }
  meets.sort((x, y) => x.d - y.d);
  const done = new Set();
  for (const m of meets) {
    if (done.has(m.p) || done.has(m.q)) continue;
    done.add(m.p); done.add(m.q);
    if (m.T) pattern.push([rays[m.p].o, m.T], [rays[m.q].o, m.T]); else pattern.push([rays[m.p].o, rays[m.q].o]);
  }
}
const all = faces(pattern).map(simplify).filter((P) => area(P) > 1e-6 && inWin(centroid(P), keep));
  return { a, b, tiles, tileKinds, pattern, faces: all };
}


// ---- doğrudan çalıştırılınca: parça türlerini say ----
if (process.argv[1]?.endsWith("hankin.mjs")) {
  const { tileKinds, faces: all } = hankin();
  console.log("alt döşeme yüzleri:", tileKinds);
const kinds = new Map();
for (const P of all) {
  const ang = angles(P).map((a) => Math.round(a * 10) / 10);
  const len = P.map((p, i) => Math.round(Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]) * 1e4) / 1e4);
  // dönme/ayna bağımsız imza: açı dizisinin en küçük döngüsel biçimi
  const rots = (arr) => arr.map((_, i) => [...arr.slice(i), ...arr.slice(0, i)].join(","));
  const sig = [...rots(ang), ...rots([...ang].reverse())].sort()[0] + " | " + [...new Set(len)].sort().join(",");
  if (!kinds.has(sig)) kinds.set(sig, { count: 0, sample: P, ang, len });
  kinds.get(sig).count++;
}
console.log("\ndesen parçaları (merkez çevresi):");
for (const [sig, k] of kinds) console.log(` ${k.count}× ${k.sample.length} köşe  açılar ${sig}`);
if (process.argv[2]) (await import("node:fs")).writeFileSync(process.argv[2], JSON.stringify({ E, R, A, B, pieces: [...kinds.values()].map((k) => ({ count: k.count, points: k.sample, angles: k.ang })) }));
}

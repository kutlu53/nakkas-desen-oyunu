// Saf geometri yardımcıları. Yan etkisiz; tests/geometry.test.html ile denetlenir.
// Koordinatlar parça biriminde (ana yıldız dış yarıçapı = 1). Ekrana ölçek app katmanında uygulanır.

export const EPS = 1e-6;
export const SNAP_DIST = 0.08;      // köşe yapışma mesafesi (parça birimi; app katmanı piksele göre büyütebilir)
export const VERTEX_TOL = 0.01;     // iki köşenin "aynı köşe" sayılma mesafesi
export const OVERLAP_TOL = 2e-3;    // çakışma denetiminde sınır payı
export const ANGLE_TOL = 0.5;       // derece

export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;
export const norm360 = (d) => ((d % 360) + 360) % 360;
/** İki açı arasındaki en kısa fark (0..180). */
export const angularDistance = (a, b) => { const d = norm360(a - b); return Math.min(d, 360 - d); };

/** Noktayı döndürüp ötele. */
export function transformPoint([x, y], { x: tx = 0, y: ty = 0, rot = 0 }) {
  const a = deg2rad(rot), c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s + tx, x * s + y * c + ty];
}

/** Parça köşelerini sahne koordinatına taşı. */
export function placedPoints(piece, placement) {
  return piece.points.map((p) => transformPoint(p, placement));
}

/** Çokgenin iç açıları (derece), köşe sırasına göre. Saat yönünden bağımsız. */
export function interiorAngles(points) {
  const n = points.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[(i + n - 1) % n], [x1, y1] = points[i], [x2, y2] = points[(i + 1) % n];
    const a1 = Math.atan2(y0 - y1, x0 - x1), a2 = Math.atan2(y2 - y1, x2 - x1);
    out.push(norm360(rad2deg(a1 - a2)));
  }
  const sum = out.reduce((a, b) => a + b, 0);
  return Math.abs(sum - (n - 2) * 180) < 1 ? out : out.map((a) => 360 - a);
}

/** Yönlü alan: >0 saat yönünün tersi (ekran koordinatında ters okunur ama tutarlıdır). */
export function signedArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export const dist = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);

export function centroid(points) {
  const n = points.length;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

export function bbox(points) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const [x, y] of points) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  return { minx, miny, maxx, maxy };
}
export const bboxesIntersect = (a, b, tol = 0) => !(a.maxx < b.minx - tol || b.maxx < a.minx - tol || a.maxy < b.miny - tol || b.maxy < a.miny - tol);

/** Aile için izinli dönme adımı (derece). */
export const familyStep = (family) => 360 / family;

/** rot değerini aile adımına yuvarla. */
export function snapRotation(rot, family) {
  const step = familyStep(family);
  return norm360(Math.round(rot / step) * step);
}

/** Açı listesini tekrarsızlaştır (1e-6 toleransla). */
export function dedupeAngles(list) {
  const out = [];
  for (const a of list.map(norm360)) if (!out.some((b) => angularDistance(a, b) < 1e-6)) out.push(a);
  return out;
}

/**
 * Sürüklenen parçanın köşelerinden biri sahnedeki herhangi bir köşeye yakın mı?
 * scenePlaced: [{piece, placement}] — sabit + yerleşmiş parçalar.
 * Döner: {d, vertexIndex, vertex, target, dx, dy} ya da null. dx/dy uygulanınca köşeler çakışır.
 */
export function findVertexSnap(piece, placement, scenePlaced, snapDist = SNAP_DIST) {
  const mine = placedPoints(piece, placement);
  let best = null;
  for (const { piece: sp, placement: spl } of scenePlaced) {
    const theirs = placedPoints(sp, spl);
    mine.forEach((v, vi) => {
      for (const t of theirs) {
        const d = dist(v, t);
        if (d <= snapDist && (!best || d < best.d)) best = { d, vertexIndex: vi, vertex: v, target: t, dx: t[0] - v[0], dy: t[1] - v[1] };
      }
    });
  }
  return best;
}

/**
 * Bir sahne köşesinde toplanan iç açıları hesapla.
 * Döner: {total, parts:[{pieceIndex, angle}], gap}. total: 360 tam, <360 boşluk, >360 çakışma.
 */
export function angleSumAtVertex(vertex, scenePlaced, tol = VERTEX_TOL) {
  const parts = [];
  scenePlaced.forEach(({ piece, placement }, pieceIndex) => {
    const pts = placedPoints(piece, placement);
    const angles = piece.angles ?? interiorAngles(piece.points);
    pts.forEach((p, i) => { if (dist(p, vertex) <= tol) parts.push({ pieceIndex, angle: angles[i] }); });
  });
  const total = parts.reduce((s, p) => s + p.angle, 0);
  return { total: Math.round(total * 10) / 10, parts, gap: Math.round((360 - total) * 10) / 10 };
}

export const vertexState = (gap) => (Math.abs(gap) < ANGLE_TOL ? "tam" : gap > 0 ? "bosluk" : "cakisma");

/** Sahnedeki tüm paylaşılan köşelerin açı durumunu ver (ipucu rengi için). */
export function evaluateVertices(scenePlaced, tol = VERTEX_TOL) {
  const seen = [];
  const results = [];
  for (const { piece, placement } of scenePlaced) {
    for (const p of placedPoints(piece, placement)) {
      if (seen.some((q) => dist(p, q) <= tol)) continue;
      seen.push(p);
      const r = angleSumAtVertex(p, scenePlaced, tol);
      if (r.parts.length > 1) results.push({ vertex: p, ...r, state: vertexState(r.gap) });
    }
  }
  return results;
}

// ---------- çakışma ----------

/** Noktanın doğru parçasına uzaklığı. */
export function segDist(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Noktanın çokgen sınırına uzaklığı. */
export function distToBoundary(p, points) {
  let m = Infinity;
  for (let i = 0; i < points.length; i++) m = Math.min(m, segDist(p, points[i], points[(i + 1) % points.length]));
  return m;
}

/** Nokta çokgenin içinde mi (ışın yöntemi). Sınırdaki noktalar belirsizdir; distToBoundary ile birlikte kullan. */
export function pointInPolygon([px, py], points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** İki doğru parçası uçları dışında, "gerçekten" kesişiyor mu (tol: mesafe payı). */
export function segmentsCross(a1, a2, b1, b2, tol = OVERLAP_TOL) {
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const la = dist(a1, a2), lb = dist(b1, b2);
  if (la < EPS || lb < EPS) return false;
  const d1 = cross(b1, b2, a1) / lb, d2 = cross(b1, b2, a2) / lb, d3 = cross(a1, a2, b1) / la, d4 = cross(a1, a2, b2) / la;
  const opp = (u, v) => (u > tol && v < -tol) || (u < -tol && v > tol);
  return opp(d1, d2) && opp(d3, d4);
}

/**
 * İki çokgenin alanları çakışıyor mu? Ortak kenar/köşe çakışma sayılmaz.
 * Örnek noktalar (köşe, ağırlık merkezi, kenar ortaları, merkez-köşe ortaları) karşı çokgenin içine düşüyorsa
 * ya da kenarlar gerçekten kesişiyorsa çakışma vardır. İçbükey parçalarda da çalışır.
 */
export function polygonsOverlap(A, B, tol = OVERLAP_TOL) {
  if (!bboxesIntersect(bbox(A), bbox(B), -tol)) return false;
  const samples = (P) => {
    const c = centroid(P), out = [...P, c];
    for (let i = 0; i < P.length; i++) {
      const q = P[(i + 1) % P.length];
      out.push([(P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2], [(P[i][0] + c[0]) / 2, (P[i][1] + c[1]) / 2]);
    }
    return out;
  };
  const strictlyInside = (p, P) => pointInPolygon(p, P) && distToBoundary(p, P) > tol;
  if (samples(A).some((p) => strictlyInside(p, B)) || samples(B).some((p) => strictlyInside(p, A))) return true;
  for (let i = 0; i < A.length; i++) for (let j = 0; j < B.length; j++)
    if (segmentsCross(A[i], A[(i + 1) % A.length], B[j], B[(j + 1) % B.length], tol)) return true;
  return false;
}

/** Parça sahnedekilerden biriyle çakışıyorsa o sahne indeksini, yoksa -1 döner. */
export function anyOverlap(piece, placement, scenePlaced, tol = OVERLAP_TOL) {
  const pts = placedPoints(piece, placement), bb = bbox(pts);
  for (let i = 0; i < scenePlaced.length; i++) {
    const q = placedPoints(scenePlaced[i].piece, scenePlaced[i].placement);
    if (!bboxesIntersect(bb, bbox(q), -tol)) continue;
    if (polygonsOverlap(pts, q, tol)) return i;
  }
  return -1;
}

// ---------- yerleşim çözücü ----------

/** Yerel köşe vi hedef T'ye gelecek şekilde, rot derece dönmüş yerleşim. */
export function placeVertexAt(piece, vi, rot, T) {
  const [px, py] = transformPoint(piece.points[vi], { rot });
  return { x: T[0] - px, y: T[1] - py, rot: norm360(rot) };
}

/** i. köşeden çıkan iki kenarın yön açıları (derece). */
export function edgeAnglesAt(points, i) {
  const n = points.length, [x, y] = points[i];
  return [points[(i + n - 1) % n], points[(i + 1) % n]].map(([qx, qy]) => norm360(rad2deg(Math.atan2(qy - y, qx - x))));
}

/** Parçanın vi köşesi T'deyken, bir kenarı sahnedeki T'den çıkan bir kenarla çakıştıran dönme açıları. */
export function alignmentRotations(piece, vi, scenePlaced, T, tol = VERTEX_TOL) {
  const mine = edgeAnglesAt(piece.points, vi);
  const out = [];
  for (const { piece: sp, placement } of scenePlaced) {
    const pts = placedPoints(sp, placement);
    pts.forEach((p, i) => {
      if (dist(p, T) > tol) return;
      for (const sa of edgeAnglesAt(pts, i)) for (const ma of mine) out.push(sa - ma);
    });
  }
  return dedupeAngles(out);
}

/** Parçanın sahnedeki parçalarla birebir paylaştığı kenar sayısı. */
export function sharedEdgeCount(pts, scenePlaced, tol = VERTEX_TOL) {
  let count = 0;
  const n = pts.length;
  for (const { piece, placement } of scenePlaced) {
    const q = placedPoints(piece, placement), m = q.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      for (let j = 0; j < m; j++) {
        const c = q[j], d = q[(j + 1) % m];
        if ((dist(a, c) <= tol && dist(b, d) <= tol) || (dist(a, d) <= tol && dist(b, c) <= tol)) count++;
      }
    }
  }
  return count;
}

export const MAX_SETTLE = 0.8;   // bırakılan yerden en fazla bu kadar "maliyet"le kayarak oturur (birim + dönme payı)
export const ALIGN_BONUS = 0.5;  // kenarı hizalı aday, köşe etrafında ~20° dönmenin maliyetini (≈0.35) aşacak kadar tercih edilir

/** Parçanın kendi köşelerinden birinde toplam 360'ı aşıyor mu? (bütün sahneyi taramadan, hızlı) */
export function exceedsAtOwnVertices(piece, placement, scenePlaced, tol = VERTEX_TOL) {
  const sceneWith = [...scenePlaced, { piece, placement }];
  return placedPoints(piece, placement).some((p) => angleSumAtVertex(p, sceneWith, tol).gap < -ANGLE_TOL);
}

/** Parça (origin, rot) konumundayken sahne köşelerine snapDist içindeki köşe çiftleri, yakından uzağa. */
function vertexPairs(piece, origin, rot, scenePlaced, snapDist) {
  const mine = placedPoints(piece, { x: origin[0], y: origin[1], rot });
  const out = [];
  for (const { piece: sp, placement: spl } of scenePlaced) for (const t of placedPoints(sp, spl)) mine.forEach((v, vi) => { const d = dist(v, t); if (d <= snapDist) out.push({ d, vi, T: t }); });
  return out.sort((a, b) => a.d - b.d);
}

/**
 * Bırakılan parça için nihai yerleşim.
 * Adaylar: (a) aile adımının her katı için, o dönmede snapDist içindeki köşe çiftleri (yalnızca öteleme);
 *          (b) mevcut dönmedeki en yakın çiftlerde, bir kenarı sahne kenarına hizalayan dönmeler (aile dışı parçalar için).
 * Elenenler: çakışan, bir köşede 360'ı aşan, bırakılan yerden fazla uzaklaşan (maxSettle).
 * Puan (küçük iyi): kayma + 0.4·(dönme/90) − ALIGN_BONUS·(kenar hizalı) − 0.05·(paylaşılan kenar).
 * Döner: {placement, snapped, overlap, target}. overlap=true ise sığan aday yok; parça geri gönderilmeli.
 */
export function resolvePlacement(piece, placement, scenePlaced, { snapDist = SNAP_DIST, tol = OVERLAP_TOL, maxSettle = MAX_SETTLE } = {}) {
  const rot0 = norm360(placement.rot), origin = [placement.x, placement.y];
  const step = familyStep(piece.family ?? 4), nRot = Math.max(1, Math.round(360 / step));
  const cands = [], seen = new Set();
  const add = (pl, vi, T) => { const k = `${pl.x.toFixed(4)},${pl.y.toFixed(4)},${pl.rot.toFixed(3)}`; if (!seen.has(k)) { seen.add(k); cands.push({ placement: pl, vi, T }); } };
  for (let k = 0; k < nRot; k++) {
    const r = norm360(rot0 + k * step);
    for (const p of vertexPairs(piece, origin, r, scenePlaced, snapDist).slice(0, 8)) add(placeVertexAt(piece, p.vi, r, p.T), p.vi, p.T);
  }
  const nearest = vertexPairs(piece, origin, rot0, scenePlaced, snapDist);
  for (const p of nearest.slice(0, 4)) for (const r of alignmentRotations(piece, p.vi, scenePlaced, p.T)) add(placeVertexAt(piece, p.vi, r, p.T), p.vi, p.T);
  if (!cands.length) {
    const pl = { x: placement.x, y: placement.y, rot: rot0 };
    return { placement: pl, snapped: false, overlap: anyOverlap(piece, pl, scenePlaced, tol) >= 0, target: null };
  }
  let best = null;
  for (const c of cands) {
    const pl = c.placement;
    const cost = dist([pl.x, pl.y], origin) + 0.4 * (angularDistance(pl.rot, rot0) / 90);
    if (cost > maxSettle) continue;
    if (anyOverlap(piece, pl, scenePlaced, tol) >= 0) continue;
    if (exceedsAtOwnVertices(piece, pl, scenePlaced)) continue;
    const aligned = alignmentRotations(piece, c.vi, scenePlaced, c.T).some((a) => angularDistance(a, pl.rot) < 1e-6);
    const score = cost - (aligned ? ALIGN_BONUS : 0) - 0.05 * sharedEdgeCount(placedPoints(piece, pl), scenePlaced);
    if (!best || score < best.score) best = { placement: pl, score, target: c.T };
  }
  if (best) return { placement: best.placement, snapped: true, overlap: false, target: best.target };
  const fb = nearest[0] ? placeVertexAt(piece, nearest[0].vi, rot0, nearest[0].T) : cands[0].placement;
  return { placement: fb, snapped: true, overlap: true, target: nearest[0] ? nearest[0].T : cands[0].T };
}

/**
 * Parça grubunu (birim hücre gibi) döndürmeden yerleştir: grup içindeki bir köşe sahnedeki bir köşeye yapışır.
 * group: [{piece, placement}] (grup yerel koordinatları); offset: {x, y}. En az kayan çakışmasız aday seçilir.
 * Döner: {offset, snapped, overlap, target}.
 */
export function resolveGroupPlacement(group, offset, scenePlaced, { snapDist = SNAP_DIST, tol = OVERLAP_TOL, maxSettle = MAX_SETTLE } = {}) {
  const pairs = [];
  for (const { piece, placement } of group) for (const p of vertexPairs(piece, [placement.x + offset.x, placement.y + offset.y], placement.rot || 0, scenePlaced, snapDist)) {
    const v = transformPoint(piece.points[p.vi], { x: placement.x + offset.x, y: placement.y + offset.y, rot: placement.rot || 0 });
    pairs.push({ d: p.d, T: p.T, off: { x: offset.x + p.T[0] - v[0], y: offset.y + p.T[1] - v[1] } });
  }
  pairs.sort((a, b) => a.d - b.d);
  const fits = (off) => {
    const moved = group.map(({ piece, placement }) => ({ piece, placement: { ...placement, x: placement.x + off.x, y: placement.y + off.y } }));
    if (moved.some(({ piece, placement }) => anyOverlap(piece, placement, scenePlaced, tol) >= 0)) return false;
    return !moved.some(({ piece, placement }) => exceedsAtOwnVertices(piece, placement, scenePlaced));
  };
  if (!pairs.length) return { offset: { x: offset.x, y: offset.y }, snapped: false, overlap: !fits(offset), target: null };
  const seen = new Set();
  for (const p of pairs.slice(0, 12)) {
    const k = `${p.off.x.toFixed(4)},${p.off.y.toFixed(4)}`;
    if (seen.has(k) || p.d > maxSettle) continue;
    seen.add(k);
    if (fits(p.off)) return { offset: p.off, snapped: true, overlap: false, target: p.T };
  }
  return { offset: pairs[0].off, snapped: true, overlap: true, target: pairs[0].T };
}

/** İki nokta kümesi (sırasız) tolerans içinde aynı mı? */
export function samePointSet(A, B, tol = 0.03) {
  if (A.length !== B.length) return false;
  const used = new Set();
  return A.every((a) => {
    const i = B.findIndex((b, idx) => !used.has(idx) && dist(a, b) <= tol);
    if (i >= 0) used.add(i);
    return i >= 0;
  });
}

/**
 * Hedef çözümle karşılaştır. Parçanın kendi dönme simetrisi (ör. yıldız 45° döndürülünce aynı) ve
 * sahnenin yıldız simetrisiyle döndürülmüş eşdeğer çözümler kabul edilir. Köşe kümeleri karşılaştırılır.
 * placed/targets: [{pieceId,x,y,rot}], byId: parça sözlüğü.
 */
export function matchesTargets(placed, targets, family, byId, tol = 0.03) {
  if (placed.length !== targets.length) return false;
  const step = familyStep(family);
  const placedPts = placed.map((p) => ({ pieceId: p.pieceId, pts: placedPoints(byId[p.pieceId], p) }));
  for (let k = 0; k < family; k++) {
    const rot = k * step;
    const used = new Set();
    const ok = targets.every((t) => {
      const [x, y] = transformPoint([t.x, t.y], { rot });
      const tpts = placedPoints(byId[t.pieceId], { x, y, rot: t.rot + rot });
      const i = placedPts.findIndex((p, idx) => !used.has(idx) && p.pieceId === t.pieceId && samePointSet(p.pts, tpts, tol));
      if (i >= 0) used.add(i);
      return i >= 0;
    });
    if (ok) return true;
  }
  return false;
}

/** Öteleme vektörü (ox,oy) = i·a + j·b çözümü; tamsayıya yakınsa {i,j}, değilse null. */
export function latticeCoords([ox, oy], a, b, tol = 0.03) {
  const det = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(det) < EPS) return null;
  const i = (ox * b[1] - oy * b[0]) / det, j = (a[0] * oy - a[1] * ox) / det;
  const ri = Math.round(i), rj = Math.round(j);
  return Math.abs(i - ri) <= tol && Math.abs(j - rj) <= tol ? { i: ri, j: rj } : null;
}

/** SVG path dizesi. */
export const toPath = (points) => "M" + points.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" L") + " Z";

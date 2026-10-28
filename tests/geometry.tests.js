// geometry.js için örnekler. Framework yok: ok(ad, koşul). Tarayıcıda geometry.test.html, komut satırında run-node.mjs çalıştırır.
export function run(G, pieces, levels, ok) {
  const near = (a, b, t = 1e-6) => Math.abs(a - b) < t;
  const by = Object.fromEntries(pieces.map((p) => [p.id, p]));
  const sc = (id, x, y, rot = 0) => ({ piece: by[id], placement: { x, y, rot } });

  // --- temel ---
  const square = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]];
  ok("kare iç açıları 90", G.interiorAngles(square).every((a) => near(a, 90)));
  ok("kare ters yönde de 90", G.interiorAngles([...square].reverse()).every((a) => near(a, 90)));
  ok("snapRotation 8'li: 50 → 45", near(G.snapRotation(50, 8), 45));
  ok("snapRotation 10'lu: 50 → 36", near(G.snapRotation(50, 10), 36));
  ok("angularDistance 350 ↔ 10 = 20", near(G.angularDistance(350, 10), 20));
  ok("dedupeAngles 0/360/720 tek", G.dedupeAngles([0, 360, 720, 45]).length === 2);

  // --- parça verisi ---
  ok("28 parça", pieces.length === 28);
  ok("8'li yıldız iç açılar 90/225", by["sekiz-kose-yildiz"].angles.every((a) => a === 90 || a === 225));
  ok("haç açıları 135/90/270", by["hac"].angles.every((a) => [135, 90, 270].includes(a)));
  ok("10'lu yıldız çentiği 108 = beşgen", near(360 - Math.max(...by["on-kose-yildiz"].angles), 108) && by["besgen"].angles.every((a) => near(a, 108)));
  ok("6'lı yıldız çentiği 120 = altıgen", near(360 - Math.max(...by["alti-kose-yildiz"].angles), 120));
  ok("12'li yıldız çentiği 90 = kare", near(360 - Math.max(...by["oniki-kose-yildiz"].angles), 90));
  const edgeLens = (pts) => pts.map((p, i) => G.dist(p, pts[(i + 1) % pts.length]));
  ok("yıldız ve haç kenarları eşit (√2−1)", [...edgeLens(by["sekiz-kose-yildiz"].points), ...edgeLens(by["hac"].points)].every((l) => near(l, Math.SQRT2 - 1, 1e-3)));

  // --- köşe açı toplamı ---
  const twoSquares = [sc("kare-kucuk", 0, 0), sc("kare-kucuk", 1, 0)];
  const v = G.evaluateVertices(twoSquares);
  ok("iki bitişik kare: paylaşılan köşelerde 180", v.length === 2 && v.every((r) => near(r.total, 180)));
  ok("durum 'bosluk'", v.every((r) => r.state === "bosluk"));

  // yıldız(0,0) + haç(1,1): döşemenin birim hücresi
  const cell = [sc("sekiz-kose-yildiz", 0, 0), sc("hac", 1, 1)];
  const cv = G.evaluateVertices(cell);
  ok("yıldız+haç: 5 ortak köşe", cv.length === 5);
  ok("çentikte 225+135=360, uçta 90+270=360 (3 tam)", cv.filter((r) => r.state === "tam").length === 3);
  ok("uç uca değen 2 köşede 180 (komşu birimi bekler)", cv.filter((r) => near(r.total, 180)).length === 2);
  ok("yıldız+haç çakışmıyor", G.anyOverlap(by["hac"], { x: 1, y: 1, rot: 0 }, [cell[0]]) === -1);

  // --- snap ---
  const snap = G.findVertexSnap(by["kare-kucuk"], { x: 1.05, y: 0.03, rot: 0 }, twoSquares.slice(0, 1));
  ok("vertex snap bulundu, dx/dy doğru", snap && near(snap.dx, -0.05, 1e-9) && near(snap.dy, -0.03, 1e-9));
  ok("snap köşe indeksi veriyor", snap && Number.isInteger(snap.vertexIndex));

  // --- çakışma ---
  const sq = (x, y, s = 1) => [[x - s / 2, y - s / 2], [x + s / 2, y - s / 2], [x + s / 2, y + s / 2], [x - s / 2, y + s / 2]];
  ok("üst üste kareler çakışır", G.polygonsOverlap(sq(0, 0), sq(0.3, 0.2)));
  ok("aynı yerdeki kareler çakışır", G.polygonsOverlap(sq(0, 0), sq(0, 0)));
  ok("bitişik kareler çakışmaz", !G.polygonsOverlap(sq(0, 0), sq(1, 0)));
  ok("köşe köşeye kareler çakışmaz", !G.polygonsOverlap(sq(0, 0), sq(1, 1)));
  ok("küçük kare büyüğün içinde çakışır", G.polygonsOverlap(sq(0, 0, 2), sq(0.2, 0.1, 0.5)));
  ok("haç koltuğuna oturan yıldız ucu çakışma değil", !G.polygonsOverlap(G.placedPoints(by["sekiz-kose-yildiz"], { x: 0, y: 0, rot: 0 }), G.placedPoints(by["hac"], { x: 1, y: 1, rot: 0 })));
  ok("yıldız üstüne haç çakışır", G.polygonsOverlap(G.placedPoints(by["sekiz-kose-yildiz"], { x: 0, y: 0, rot: 0 }), G.placedPoints(by["hac"], { x: 0.6, y: 0.6, rot: 0 })));

  // --- yerleşim çözücü ---
  const star = [sc("sekiz-kose-yildiz", 0, 0)];
  let r = G.resolvePlacement(by["hac"], { x: 1.06, y: 0.95, rot: 0 }, star, { snapDist: 0.2 });
  ok("haç (1.06,0.95) → (1,1) yapışır", r.snapped && !r.overlap && near(r.placement.x, 1, 1e-6) && near(r.placement.y, 1, 1e-6));
  r = G.resolvePlacement(by["hac"], { x: 1.06, y: 0.95, rot: 45 }, star, { snapDist: 0.2 });
  ok("45° dönük haç 45° dönüp (1,1)'e oturur", r.snapped && !r.overlap && near(r.placement.x, 1, 1e-6) && near(r.placement.y, 1, 1e-6) && near(G.angularDistance(r.placement.rot, 0) % 90, 0, 1e-6));
  const full = G.evaluateVertices([...star, { piece: by["hac"], placement: r.placement }]);
  ok("çözülen yerleşimde çentikler tam", full.filter((x) => x.state === "tam").length === 3);
  // kare: köşesi çentiğe, kenarı yıldız kenarına; 45° açık kalır
  r = G.resolvePlacement(by["kare-kucuk"], { x: 1.24, y: 0.77, rot: 0 }, star, { snapDist: 0.2 });
  const kv = G.evaluateVertices([...star, { piece: by["kare-kucuk"], placement: r.placement }]);
  ok("kare çentiğe yapışır, çakışmaz", r.snapped && !r.overlap && near(r.placement.x, 1.2071, 1e-3) && near(r.placement.y, 0.7929, 1e-3));
  ok("kare çentikte 45° açık bırakır (225+90=315)", kv.some((x) => near(x.total, 315) && near(x.gap, 45)));
  r = G.resolvePlacement(by["hac"], { x: 0.3, y: 0.2, rot: 0 }, star, { snapDist: 0.2 });
  ok("yıldızın ortasına bırakılan haç → sığmaz, geri zıplar", r.overlap);
  r = G.resolvePlacement(by["hac"], { x: 5, y: 5, rot: 0 }, star, { snapDist: 0.2 });
  ok("uzağa bırakılan haç yapışmaz, çakışmaz", !r.snapped && !r.overlap && near(r.placement.x, 5));

  // beşgen (10'lu) 8'li çentiğe: köşesi çentiğe yapışır, kenarı yıldız kenarlarından birine hizalanır, 27° açık kalır.
  // Yanlış aile kuraldan değil açıdan belli olur: 225 + 108 = 333.
  const notch = [0.7071, 0.2929];
  const pentDrop = G.placeVertexAt(by["besgen"], 0, 288, notch);
  r = G.resolvePlacement(by["besgen"], { x: pentDrop.x + 0.03, y: pentDrop.y - 0.02, rot: 288 }, star, { snapDist: 0.2 });
  const pv = G.evaluateVertices([...star, { piece: by["besgen"], placement: r.placement }]);
  ok("beşgen 8'li çentikte 27° açık bırakır (225+108=333)", r.snapped && !r.overlap && pv.some((x) => near(x.total, 333)));
  ok("beşgen kenarı yıldız kenarına hizalanır (279 ya da 306)", G.alignmentRotations(by["besgen"], 0, star, notch).some((a) => near(a, r.placement.rot, 1e-6)));

  // --- grup (birim hücre) ---
  const group = [sc("sekiz-kose-yildiz", 0, 0), sc("hac", 1, 1)];
  let gr = G.resolveGroupPlacement(group, { x: 2.04, y: -0.03 }, cell, { snapDist: 0.2 });
  ok("hücre kopyası (2,0)'a yapışır", gr.snapped && !gr.overlap && near(gr.offset.x, 2, 1e-6) && near(gr.offset.y, 0, 1e-6));
  gr = G.resolveGroupPlacement(group, { x: 1, y: 0 }, cell, { snapDist: 0.2 });
  ok("hücre kopyası (1,0)'da çakışır", gr.overlap);
  ok("kafes koordinatı (2,0)→(1,0)", JSON.stringify(G.latticeCoords([2, 0], [2, 0], [0, 2])) === '{"i":1,"j":0}');
  ok("kafes dışı (1,0)→null", G.latticeCoords([1, 0], [2, 0], [0, 2]) === null);

  // --- hedef eşleme ---
  const targets = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, y]) => ({ pieceId: "hac", x, y, rot: 0 }));
  const placedOk = targets.map((t, i) => ({ ...t, rot: (i * 90) % 360 }));
  ok("4 haç, farklı dönüşlerle (haç 4 katlı simetrik) eşleşir", G.matchesTargets(placedOk, targets, 8, by));
  ok("3 haç eşleşmez", !G.matchesTargets(placedOk.slice(0, 3), targets, 8, by));
  ok("yanlış yerde haç eşleşmez", !G.matchesTargets([...placedOk.slice(0, 3), { pieceId: "hac", x: 2, y: 0, rot: 0 }], targets, 8, by));
  const starTargets = targets.map((t) => ({ ...t, pieceId: "sekiz-kose-yildiz" }));
  ok("yıldızlar 45° dönük de eşleşir", G.matchesTargets(starTargets.map((t) => ({ ...t, rot: 45 })), starTargets, 8, by));

  // --- geçme çizgisi ---
  ok("kesişim: çarpı (0,0)", JSON.stringify(G.segmentIntersection([-1, 0], [1, 0], [0, -1], [0, 1])) === "[0,0]");
  ok("kesişim: uçta değme sayılmaz", G.segmentIntersection([0, 0], [1, 0], [1, 0], [1, 1]) === null);
  const bands = G.starBands(by["sekiz-kose-yildiz"], { x: 0, y: 0, rot: 0 });
  ok("8'li yıldız → 2 bant (iki kare), her biri 4 köşe", bands.length === 2 && bands.every((b) => b.length === 4));
  ok("bantların köşeleri yıldızın uçları (r = 1)", bands.flat().every((p) => near(Math.hypot(...p), 1, 1e-3)));
  ok("haç yıldız değil → bant yok", G.starBands(by["hac"], { x: 0, y: 0, rot: 0 }).length === 0);
  const cr = G.interlaceCrossings(bands);
  ok("iki kare 8 noktada kesişir (çentikler)", cr.length === 8 && cr.every((c) => by["sekiz-kose-yildiz"].points.some((p) => G.dist(p, c.p) < 1e-3)));
  ok("her bant 4 kez üstten geçer", cr.filter((c) => c.over === 0).length === 4 && cr.filter((c) => c.over === 1).length === 4);
  const along = cr.map((c) => ({ c, a: Math.atan2(c.p[1], c.p[0]) })).sort((x, y) => x.a - y.a).map((x) => x.c.over);
  ok("çevre boyunca sırayla üst-alt (0,1,0,1…)", along.every((o, i) => o !== along[(i + 1) % along.length]));

  // --- aynalama ---
  const mx = G.reflectAcross("x", 1);
  ok("x=1 aynası (0,0) → (2,0)", JSON.stringify(G.affineApply(mx, [0, 0])) === "[2,0]");
  ok("ayna ∘ ayna = özdeşlik", G.affineCompose(mx, mx).every((v, i) => near(v, G.IDENTITY[i])));
  ok("x=1 aynası deseni korur (yıldız (2,0)'a)", G.preservesLattice(mx, [0, 0], [2, 0], [0, 2]));
  ok("1 birim öteleme deseni bozar (yıldız (1,0)'a)", !G.preservesLattice(G.translateBy(1, 0), [0, 0], [2, 0], [0, 2]));
  ok("2 birim öteleme korur", G.preservesLattice(G.translateBy(2, 0), [0, 0], [2, 0], [0, 2]));
  ok("ayna sonra öteleme: y=1 aynası ∘ (1,0) öteleme bozar", !G.preservesLattice(G.affineCompose(G.translateBy(1, 0), G.reflectAcross("y", 1)), [0, 0], [2, 0], [0, 2]));

  // --- bozuk çini: eksikler tam oturur, benzer yıldızlar sığmaz ---
  for (const lv of (levels || []).filter((l) => l.id === "f8-l5")) {
    const fixedSc = lv.fixed.map((f) => sc(f.pieceId, f.x, f.y, f.rot));
    const full = G.evaluateVertices([...fixedSc, ...lv.targets.map((t) => sc(t.pieceId, t.x, t.y, t.rot))]);
    ok(`${lv.id}: tam desende çakışma yok`, full.length > 0 && full.every((v) => v.state !== "cakisma"));
    ok(`${lv.id}: her eksik, yakına bırakılınca tam yerine oturur`, lv.targets.every((t) => {
      const r = G.resolvePlacement(by[t.pieceId], { x: t.x + 0.04, y: t.y - 0.03, rot: 0 }, fixedSc, { snapDist: 0.2 });
      return r.snapped && !r.overlap && near(r.placement.x, t.x, 1e-6) && near(r.placement.y, t.y, 1e-6);
    }));
    const hole = lv.targets.find((t) => t.pieceId === "sekiz-kose-yildiz");
    ok(`${lv.id}: 10'lu ve 12'li yıldız 8'li boşluğa sığmaz`, ["on-kose-yildiz", "oniki-kose-yildiz"].every((id) => G.resolvePlacement(by[id], { x: hole.x + 0.03, y: hole.y + 0.02, rot: 0 }, fixedSc, { snapDist: 0.2 }).overlap));
  }

  // --- 10'lu yıldızın çevresi: on beşgen ---
  ok("beşgen kenarı = 10'lu yıldız kenarı", near(G.dist(by.besgen.points[0], by.besgen.points[1]), G.dist(by["on-kose-yildiz"].points[0], by["on-kose-yildiz"].points[1]), 1e-3));
  for (const lv of (levels || []).filter((l) => l.id === "f10-l1")) {
    const ring = [sc("on-kose-yildiz", 0, 0), ...lv.targets.map((t) => sc(t.pieceId, t.x, t.y, t.rot))];
    const rv = G.evaluateVertices(ring);
    ok(`${lv.id}: 10 beşgen çakışmasız`, ring.slice(1).every((s, i) => G.anyOverlap(s.piece, s.placement, ring.filter((_, j) => j !== i + 1)) === -1));
    ok(`${lv.id}: 10 çentikte 252 + 108 = 360, 10 uçta 288`, rv.filter((v) => v.state === "tam").length === 10 && rv.filter((v) => near(v.total, 288, 0.5)).length === 10);
  }

  // --- 10'lu kesin desen (build/gen_levels10.mjs): hedefler sırayla bırakılınca tam yerine oturur ---
  const settles = (lv) => {
    const scene = lv.fixed.map((f) => sc(f.pieceId, f.x, f.y, f.rot));
    return lv.targets.every((t) => {
      const r = G.resolvePlacement(by[t.pieceId], { x: t.x + 0.02, y: t.y - 0.015, rot: t.rot }, scene, { snapDist: 0.12 });
      const okk = r.snapped && !r.overlap && G.samePointSet(G.placedPoints(by[t.pieceId], r.placement), G.placedPoints(by[t.pieceId], t), 1e-3);
      if (!okk) console.log(`  ${lv.id}: ${t.pieceId} (${t.x}, ${t.y}) oturmadı`);
      scene.push(sc(t.pieceId, t.x, t.y, t.rot));
      return okk;
    });
  };
  for (const id of ["f10-l2", "f10-l4", "f6-l1", "f6-l2", "f6-l4", "f12-l1"]) {
    const lv = (levels || []).find((l) => l.id === id); if (!lv) continue;
    const full = G.evaluateVertices([...lv.fixed, ...lv.targets].map((f) => sc(f.pieceId, f.x, f.y, f.rot)));
    ok(`${id}: tam desende çakışma yok`, full.length > 0 && full.every((v) => v.state !== "cakisma"));
    ok(`${id}: her hedef yakına bırakılınca tam yerine oturur`, settles(lv));
  }
  for (const [id, own, others] of [["f10-l4", "on-kose-yildiz", ["sekiz-kose-yildiz", "oniki-kose-yildiz"]], ["f6-l4", "alti-kose-yildiz", ["sekiz-kose-yildiz", "oniki-kose-yildiz"]]]) {
    const lb = (levels || []).find((l) => l.id === id); if (!lb) continue;
    const sc4 = lb.fixed.map((f) => sc(f.pieceId, f.x, f.y, f.rot)), hole = lb.targets.find((t) => t.pieceId === own);
    ok(`${id}: ${others.join(" ve ")} boşluğa sığmaz`, others.every((o) => G.resolvePlacement(by[o], { x: hole.x + 0.02, y: hole.y + 0.02, rot: 0 }, sc4, { snapDist: 0.12 }).overlap));
  }
  for (const id of ["f10-l3", "f6-l3"]) {
    const l10c = (levels || []).find((l) => l.id === id); if (!l10c) continue;
    const { a, b } = l10c.translation, cellSc = l10c.fixed.map((f) => sc(f.pieceId, f.x, f.y, f.rot));
    const areaSum = cellSc.reduce((s, x) => s + Math.abs(G.signedArea(x.piece.points)), 0);
    ok(`${id}: hücre alanı = |a × b|`, near(areaSum, Math.abs(a[0] * b[1] - a[1] * b[0]), 2e-3));
    const g = G.resolveGroupPlacement(cellSc, { x: a[0] + 0.03, y: a[1] - 0.02 }, cellSc, { snapDist: 0.12 });
    ok(`${id}: hücre kopyası a'ya yapışır, çakışmaz`, g.snapped && !g.overlap && near(g.offset.x, a[0], 1e-3) && near(g.offset.y, a[1], 1e-3));
    const g2 = G.resolveGroupPlacement(cellSc, { x: b[0] + 0.02, y: b[1] + 0.03 }, cellSc, { snapDist: 0.12 });
    ok(`${id}: hücre kopyası b'ye yapışır, çakışmaz`, g2.snapped && !g2.overlap && near(g2.offset.x, b[0], 1e-3) && near(g2.offset.y, b[1], 1e-3));
  }

  // --- rütbe sınavı: iki aile tek sahnede ---
  const mix = (levels || []).find((l) => l.id === "karma-1");
  if (mix) {
    const all = [...mix.fixed, ...mix.targets].map((f) => sc(f.pieceId, f.x, f.y, f.rot));
    ok("karma-1: iki yıldız ve 14 hedef çakışmasız", all.every((s, i) => G.anyOverlap(s.piece, s.placement, all.filter((_, j) => j !== i)) === -1));
    const vs = G.evaluateVertices(all);
    const notches = mix.fixed.flatMap((f) => G.placedPoints(by[f.pieceId], f).filter((_, i) => by[f.pieceId].angles[i] > 180));
    ok("karma-1: iki yıldızın 18 çentiğinin hepsi 360", notches.length === 18 && notches.every((q) => vs.some((v) => v.state === "tam" && G.dist(v.vertex, q) < 1e-3)));
  }

  // --- pergel-cetvel kurulumu ---
  ok("şekil: (1,0) O merkezli birim dairede", G.pointOnShape([1, 0], G.constructionShape({ circle: ["O", "A"] }, { O: [0, 0], A: [0, 1] })));
  ok("şekil: (3,3) sonsuz doğruda, parçada değil", G.pointOnShape([3, 3], G.constructionShape({ line: ["O", "A"] }, { O: [0, 0], A: [1, 1] })) && !G.pointOnShape([3, 3], G.constructionShape({ seg: ["O", "A"] }, { O: [0, 0], A: [1, 1] })));
  for (const lv of (levels || []).filter((l) => l.tool === "construct")) {
    const pts = lv.points, seen = new Set(lv.start), shapes = [];
    let picksOk = true, revealsOk = true;
    lv.steps.forEach((st, i) => {
      if (!st.pick.every((k) => seen.has(k))) picksOk = false;
      const fresh = (st.draw || []).map((o) => G.constructionShape(o, pts));
      shapes.push(...fresh);
      // açılan her nokta, şimdiye dek çizilmiş iki şeklin kesişimi olmalı; biri bu adımdan
      for (const k of st.reveals || []) {
        const on = shapes.filter((s) => G.pointOnShape(pts[k], s)).length;
        if (on < 2 || !fresh.some((s) => G.pointOnShape(pts[k], s))) { revealsOk = false; console.log(`  ${lv.id} adım ${i + 1}: ${k} kesişim değil`); }
        seen.add(k);
      }
    });
    ok(`${lv.id}: her adımın noktaları önceden açılmış`, picksOk);
    ok(`${lv.id}: her açılan nokta iki çizimin kesişimi`, revealsOk);
    const segs = shapes.filter((s) => s.type === "segment"), star = by[lv.finale.fill];
    ok(`${lv.id}: yıldızın ${star.points.length} köşesi iki karenin kenarlarında`, star.points.every((p) => segs.filter((s) => G.pointOnShape(p, s, 2e-4)).length >= 2));
    const gh = lv.finale.ghost, [gx, gy] = gh.at ? pts[gh.at] : [gh.x, gh.y], ghostPts = G.placedPoints(by[gh.pieceId], { x: gx, y: gy, rot: gh.rot || 0 });
    ok(`${lv.id}: kılavuz ${gh.pieceId} köşesiyle çentiğe oturur`, ghostPts.some((p) => G.dist(p, lv.finale.notch) < 1e-3) && star.points.some((p) => G.dist(p, lv.finale.notch) < 1e-3));
  }
}

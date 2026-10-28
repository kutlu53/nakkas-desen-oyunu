// Kalfa — Kur: parçaları yerleştir, her köşede açılar 360'ı bulsun.
// Veri: data/levels.json. Matematik: ../geometry.js (saf). Burası yalnızca DOM, olaylar ve durum.
import { loadPieces, pieceElement, pieceThumb, FAMILY_LABEL, FAMILY_TITLE } from "../pieces.js";
import { loadCards, storyCardHTML } from "../cards.js";
import * as G from "../geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SNAP_PX = 22;        // köşe yapışma mesafesi (piksel) — cihazdan bağımsız his için birime çevrilir
const TOUCH_LIFT = 0.45;   // dokunmada parça parmağın üstünde dursun (birim)
const KB_STEP = 0.1;       // klavyeyle taşıma adımı (birim)
const BAND_PATCH = 0.14;   // geçme: kesişimde üstteki bandın yeniden çizilen yarı boyu (birim)

const $ = (s, el = document) => el.querySelector(s);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => String(Math.round(n * 10) / 10);
const sumStr = (v) => `${v.parts.map((p) => fmt(p.angle)).join(" + ")} = ${fmt(v.total)}`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

let levelsCache = null;
export async function loadLevels() {
  if (!levelsCache) levelsCache = (await (await fetch(new URL("../../data/levels.json", import.meta.url))).json()).levels;
  return levelsCache;
}

/** Giriş noktası. ctx.param seviye id'si; yoksa seviye listesi. Temizleme işlevi döner. */
export async function mount(root, ctx) {
  const [levels, { byId }, cards] = await Promise.all([loadLevels(), loadPieces(), loadCards()]);
  const level = levels.find((l) => l.id === ctx.param);
  if (!level) { renderIndex(root, ctx, levels); return () => {}; }
  if (level.tool === "construct") return (await import("./construct.js")).renderConstruct(root, ctx, level, levels, byId);
  if (level.tool === "mirror") return (await import("./mirror.js")).renderMirror(root, ctx, level, levels, byId, cards);
  return renderLevel(root, ctx, level, levels, byId, cards);
}

// ---------------- seviye listesi ----------------
function renderIndex(root, ctx, levels) {
  root.innerHTML = `<a class="back" href="#home">← Lonca</a>
    <header class="mode-head"><p class="eyebrow">Kalfa · ${ctx.difficulty}</p><h1>Kur</h1>
    <p class="lead">Önce pergel ve cetvelle çiz; parçalar çizimden çıkar. Sonra parçaları yerleştir: her köşede açılar 360'ı bulsun. Yanlış aile kuraldan değil, açıdan belli olur.</p></header>`;
  for (const fam of [8, 10, 6, 12]) {
    const list = levels.filter((l) => l.family === fam).sort((a, b) => a.order - b.order);
    const sec = document.createElement("section");
    sec.className = "family";
    sec.innerHTML = `<h2>${FAMILY_LABEL[fam]} sistem <small>${FAMILY_TITLE[fam]} · adım ${360 / fam}°</small></h2>`;
    if (!list.length) { sec.insertAdjacentHTML("beforeend", `<p class="lead">Seviyeler hazırlanıyor.</p>`); root.appendChild(sec); continue; }
    const ul = document.createElement("div");
    ul.className = "levels";
    for (const l of list) {
      const p = ctx.state.progress[l.id];
      ul.insertAdjacentHTML("beforeend", `<a class="level ${p?.completed ? "done" : ""}" href="#kur/${l.id}">
        <span class="num">${l.order || "✎"}</span><strong>${esc(l.title)}</strong>
        <small>${p?.completed ? `Tamamlandı · ${p.attempts} deneme · ${mmss(p.seconds)}` : esc(l.story)}</small></a>`);
    }
    sec.appendChild(ul);
    root.appendChild(sec);
  }
  const mixed = levels.filter((l) => Array.isArray(l.families)).sort((a, b) => a.order - b.order);
  if (mixed.length) {
    const sec = document.createElement("section");
    sec.className = "family";
    sec.innerHTML = `<h2>Rütbe sınavı <small>aileler tek kutuda</small></h2><div class="levels"></div>`;
    for (const l of mixed) {
      const p = ctx.state.progress[l.id];
      $(".levels", sec).insertAdjacentHTML("beforeend", `<a class="level ${p?.completed ? "done" : ""}" href="#kur/${l.id}">
        <span class="num">${l.families.join("+")}</span><strong>${esc(l.title)}</strong>
        <small>${p?.completed ? `Tamamlandı · ${p.attempts} deneme · ${mmss(p.seconds)}` : esc(l.story)}</small></a>`);
    }
    root.appendChild(sec);
  }
}

// ---------------- seviye ----------------
function renderLevel(root, ctx, level, levels, byId, cards = {}) {
  const diff = ctx.difficulty;
  // Tek dallanma noktası: zorluk profili. Mod kodu değil, veri dallanır.
  const profile = {
    labels: diff === "ortaokul",
    glow: diff === "ortaokul",
    ghost: diff === "ortaokul",
    familyNote: diff === "ortaokul",
    gridSize: level.gridSize?.[diff] ?? 2,
    hint: level.hint?.[diff] || level.hint?.ortaokul || "",
    distractors: level.trayDistractors?.[diff] ?? {},
  };
  const isCell = level.tool === "translate-copy";
  const isMix = Array.isArray(level.families); // rütbe sınavı: birden çok ailenin yıldızı, tek kutu
  const famText = isMix ? `${level.families.map((f) => FAMILY_LABEL[f]).join(" + ")} · rütbe sınavı` : `${FAMILY_LABEL[level.family]} sistem`;
  const famLevels = levels.filter((l) => l.family === level.family).sort((a, b) => a.order - b.order);
  const numbered = famLevels.filter((l) => l.order > 0).length; // 0: pergel-cetvel hazırlığı, sayılmaz
  const next = famLevels.find((l) => l.order > level.order);
  const fixed = level.fixed.map((f) => ({ pieceId: f.pieceId, x: f.x, y: f.y, rot: f.rot }));
  const cellPieces = fixed.map((f) => ({ piece: byId[f.pieceId], placement: { x: f.x, y: f.y, rot: f.rot } }));
  const cellTargets = isCell ? gridOffsets(profile.gridSize, level.translation) : [];

  const S = { placed: [], tray: [], drag: null, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false, labels: profile.labels, lines: false, highlight: null, uid: 1, pxPerUnit: 100 };
  const fillTray = () => {
    S.tray = Object.entries(level.tray).map(([pieceId, count]) => ({ pieceId, count }));
    for (const [pieceId, n] of Object.entries(profile.distractors)) {
      const t = S.tray.find((x) => x.pieceId === pieceId);
      if (t) t.count += n; else S.tray.push({ pieceId, count: n });
    }
    if (isCell) S.tray.push({ cell: true, count: profile.gridSize ** 2 - 1 });
  };
  fillTray();

  // ---- görünüm alanı ----
  const extent = [];
  for (const f of fixed) extent.push(...G.placedPoints(byId[f.pieceId], f));
  for (const t of level.targets) extent.push(...G.placedPoints(byId[t.pieceId], t));
  for (const c of cellTargets) for (const { piece, placement } of cellPieces) extent.push(...G.placedPoints(piece, { ...placement, x: placement.x + c.x, y: placement.y + c.y }));
  const bb = G.bbox(extent), pad = 0.9;
  const vb = { x: bb.minx - pad, y: bb.miny - pad, w: bb.maxx - bb.minx + 2 * pad, h: bb.maxy - bb.miny + 2 * pad };
  if (vb.w / vb.h < 4 / 3) { const w = (vb.h * 4) / 3; vb.x -= (w - vb.w) / 2; vb.w = w; } else { const h = (vb.w * 3) / 4; vb.y -= (h - vb.h) / 2; vb.h = h; }

  root.innerHTML = `
    <header class="mode-head">
      <a class="back" href="#kur">← Seviyeler</a>
      <p class="eyebrow">Kalfa · ${famText}${isMix ? "" : ` · ${level.order}/${numbered}`} · ${diff}</p>
      <h1>${esc(level.title)}</h1>
      <p class="story">${esc(level.story)}</p>
    </header>
    <section class="play">
      <div class="toolbar" role="toolbar" aria-label="Araçlar">
        <button type="button" data-act="rotate" title="Tutulan parçayı döndür (R)">↻ Döndür</button>
        <button type="button" data-act="labels" aria-pressed="${S.labels}">Açı etiketleri</button>
        <button type="button" data-act="hint">İpucu</button>
        <button type="button" data-act="lines" aria-pressed="false" title="Yıldızları geçme bantlarına dönüştür">Geçme çizgisi</button>
        <button type="button" data-act="reset">Sıfırla</button>
      </div>
      <p class="msg" aria-live="polite">Parçayı kutudan tahtaya sürükle; köşeye yaklaşınca yapışır. Çift tıklama ya da R döndürür.</p>
      <svg class="board" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Tahta">
        <g class="ghosts"></g><g class="fixed"></g><g class="placed"></g><g class="lines"></g><g class="labels"></g><g class="snap"></g><g class="drag"></g>
      </svg>
      <div class="tray" aria-label="Parça kutusu"></div>
    </section>
    <div class="overlay" hidden></div>`;

  const svg = $(".board", root), layers = Object.fromEntries(["ghosts", "fixed", "placed", "lines", "labels", "snap", "drag"].map((k) => [k, $(`.${k}`, svg)]));
  const trayEl = $(".tray", root), msgEl = $(".msg", root), overlay = $(".overlay", root);

  // ---- yardımcılar ----
  /** Parçanın "evi" olan aile: tek aileli seviyede seviyenin ailesi, karışık seviyede en yakın sabit yıldızın ailesi. */
  const homeFamily = (placement) => {
    if (!isMix) return level.family;
    let best = null, bd = Infinity;
    for (const f of fixed) { const dd = Math.hypot(f.x - placement.x, f.y - placement.y); if (dd < bd) { bd = dd; best = f; } }
    return byId[best.pieceId].family;
  };
  const snapUnits = () => Math.min(0.25, Math.max(0.08, SNAP_PX / S.pxPerUnit));
  const scenePlaced = (exclude = new Set()) => [...fixed, ...S.placed.filter((p) => !exclude.has(p.uid))].map((p) => ({ piece: byId[p.pieceId], placement: p }));
  const toBoard = (clientX, clientY) => { const pt = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse()); return [pt.x, pt.y]; };
  const insideBoard = (clientX, clientY) => { const r = svg.getBoundingClientRect(); return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom; };
  const tf = ({ x, y, rot }) => `translate(${x} ${y}) rotate(${rot || 0})`;
  const setMsg = (text, cls = "") => { msgEl.textContent = text; msgEl.className = `msg ${cls}`; };
  const updateScale = () => {
    const r = svg.getBoundingClientRect();
    if (r.width && r.height) S.pxPerUnit = Math.min(r.width / vb.w, r.height / vb.h);
    renderLabels();
  };

  // ---- çizim ----
  function pieceGroup(p, cls) {
    const g = svgEl("g", { class: cls, transform: tf(p) });
    g.appendChild(pieceElement(byId[p.pieceId]));
    return g;
  }
  function renderFixed() {
    layers.fixed.replaceChildren(...fixed.map((f) => pieceGroup(f, "piece fixed")));
  }
  function renderPlaced() {
    layers.placed.replaceChildren(...S.placed.map((p) => {
      const g = pieceGroup(p, `piece placed ${p.uid === S.highlight || p.cellKey === S.highlight ? "fresh" : ""}`);
      g.dataset.uid = p.uid;
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${byId[p.pieceId].name}; Enter: al, Delete: kutuya gönder`);
      return g;
    }));
    renderLines();
  }
  function renderLabels() {
    const fs = 12 / S.pxPerUnit, r = 4.5 / S.pxPerUnit;
    const scene = scenePlaced();
    const results = G.evaluateVertices(scene);
    const hl = S.highlight == null ? [] : S.placed.filter((p) => p.uid === S.highlight || p.cellKey === S.highlight).flatMap((p) => G.placedPoints(byId[p.pieceId], p));
    const frag = document.createDocumentFragment();
    for (const v of results) {
      const [x, y] = v.vertex;
      frag.appendChild(svgEl("circle", { cx: x, cy: y, r, class: `vertex vertex-${v.state}` }));
      const fresh = hl.some((p) => G.dist(p, v.vertex) <= G.VERTEX_TOL);
      const touchesPlaced = v.parts.some((pt) => pt.pieceIndex >= fixed.length); // sabit-sabit köşelerde yalnızca nokta
      if (!S.labels || !touchesPlaced || (v.state === "tam" && !fresh)) continue;
      const t = svgEl("text", { x: x + r * 1.6, y: y - r * 1.6, "font-size": fs, class: `vlabel vlabel-${v.state}` });
      t.textContent = v.state === "tam" ? `${sumStr(v)} ✓` : v.state === "bosluk" ? `${sumStr(v)} · ${fmt(v.gap)}° açık` : `${sumStr(v)} · çakışma`;
      frag.appendChild(t);
    }
    layers.labels.replaceChildren(frag);
  }
  /** Geçme görünümü: her yıldız uçlarını birleştiren bantlara ayrılır; kesişimlerde bantlar sırayla üstten ve alttan geçer. */
  function renderLines() {
    if (!S.lines) { layers.lines.replaceChildren(); return; }
    const frag = document.createDocumentFragment(), patches = [];
    const band = (d) => { frag.appendChild(svgEl("path", { d, class: "band-edge" })); frag.appendChild(svgEl("path", { d, class: "band" })); };
    for (const { piece, placement } of scenePlaced()) {
      const bands = G.starBands(piece, placement);
      bands.forEach((b) => band(G.toPath(b)));
      // üstten geçen bandın kısa parçası yeniden çizilir; alttaki bant onun altında kalır
      for (const { p: [x, y], dir: [dx, dy] } of G.interlaceCrossings(bands)) patches.push(`M${x - dx * BAND_PATCH},${y - dy * BAND_PATCH} L${x + dx * BAND_PATCH},${y + dy * BAND_PATCH}`);
    }
    patches.forEach(band);
    layers.lines.replaceChildren(frag);
  }
  function setLines(on) {
    S.lines = on;
    $("[data-act=lines]", root).setAttribute("aria-pressed", on);
    svg.classList.toggle("lineview", on);
    renderLines();
    if (on) setMsg("Geçme çizgisi: her yıldız iki kareden örülür; bantlar kesiştikleri yerde sırayla birbirinin üstünden ve altından geçer.");
  }
  function renderGhosts(showTargets = false) {
    const frag = document.createDocumentFragment();
    const outline = (piece, placement) => { const p = svgEl("path", { d: G.toPath(G.placedPoints(piece, placement)), class: "ghost" }); frag.appendChild(p); };
    if (isCell) {
      const all = [];
      for (const c of [{ x: 0, y: 0 }, ...cellTargets]) for (const { piece, placement } of cellPieces) all.push(...G.placedPoints(piece, { ...placement, x: placement.x + c.x, y: placement.y + c.y }));
      const b = G.bbox(all);
      frag.appendChild(svgEl("rect", { x: b.minx, y: b.miny, width: b.maxx - b.minx, height: b.maxy - b.miny, class: "area" }));
      if (profile.ghost || showTargets) for (const c of cellTargets) for (const { piece, placement } of cellPieces) outline(piece, { ...placement, x: placement.x + c.x, y: placement.y + c.y });
    } else if (showTargets) {
      for (const t of level.targets) outline(byId[t.pieceId], t);
    }
    layers.ghosts.replaceChildren(frag);
  }
  function renderTray() {
    trayEl.replaceChildren(...S.tray.map((item, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tray-item";
      b.dataset.idx = idx;
      const name = item.cell ? "Birim hücre" : byId[item.pieceId].name;
      const fam = item.cell ? level.family : byId[item.pieceId].family;
      if (profile.glow && !isMix && fam === level.family && item.count > 0) b.classList.add("glow");
      if (item.count <= 0) b.setAttribute("aria-disabled", "true");
      b.setAttribute("aria-label", `${name}, ${item.count} adet. Sürükle ya da Enter ile al.`);
      b.appendChild(item.cell ? cellThumb() : pieceThumb(byId[item.pieceId], 64));
      b.insertAdjacentHTML("beforeend", `<span class="count">×${item.count}</span><span class="fam" title="${FAMILY_LABEL[fam]} sistem">${fam}</span><span class="nm">${esc(name)}</span>`);
      return b;
    }));
  }
  function cellThumb() {
    const pts = cellPieces.flatMap(({ piece, placement }) => G.placedPoints(piece, placement));
    const b = G.bbox(pts), pad = 0.12;
    const s = svgEl("svg", { viewBox: `${b.minx - pad} ${b.miny - pad} ${b.maxx - b.minx + 2 * pad} ${b.maxy - b.miny + 2 * pad}`, width: 64, height: 64, role: "img", "aria-label": "Birim hücre" });
    for (const f of fixed) s.appendChild(pieceGroup(f, "piece"));
    return s;
  }
  function renderAll() { renderFixed(); renderPlaced(); renderGhosts(); renderTray(); renderLabels(); }

  // ---- sürükleme ----
  function groupFor(item) {
    return item.cell ? cellPieces : [{ piece: byId[item.pieceId], placement: { x: 0, y: 0, rot: 0 } }];
  }
  function startDrag({ group, origin, x, y, rot = 0, grab = [0, 0], pointer = null }) {
    cancelDrag(true);
    const g = svgEl("g", { class: "drag-g" });
    for (const m of group) { const sub = svgEl("g", { transform: tf(m.placement) }); sub.appendChild(pieceElement(m.piece)); g.appendChild(sub); }
    layers.drag.appendChild(g);
    S.drag = { group, origin, x, y, rot, grab, g, pointer, last: null, single: group.length === 1 };
    updateDrag();
    if (pointer) {
      const { el, id } = pointer;
      try { el.setPointerCapture(id); } catch {}
      const onMove = (e) => { if (e.pointerId !== id) return; moveDragTo(e.clientX, e.clientY); };
      const onUp = (e) => { if (e.pointerId !== id) return; S.drag.last = [e.clientX, e.clientY]; finishDrag(insideBoard(e.clientX, e.clientY)); };
      const onCancel = (e) => { if (e.pointerId !== id) return; cancelDrag(true); };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onCancel);
      S.drag.off = () => { el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onCancel); try { el.releasePointerCapture(id); } catch {} };
    }
    setMsg(group.length === 1 ? `${group[0].piece.name} elinde. Köşeyi bir köşeye yaklaştır.` : "Birim hücre elinde. Yıldız ucunu komşu yıldızın ucuna değdir.");
  }
  function moveDragTo(clientX, clientY) {
    const d = S.drag; if (!d) return;
    const [bx, by] = toBoard(clientX, clientY);
    d.x = bx - d.grab[0]; d.y = by - d.grab[1];
    updateDrag();
  }
  function updateDrag() {
    const d = S.drag; if (!d) return;
    d.g.setAttribute("transform", d.single ? tf({ x: d.x, y: d.y, rot: d.rot }) : tf({ x: d.x, y: d.y }));
    // yapışma önizlemesi
    const scene = scenePlaced();
    let snap = null;
    for (const m of d.group) {
      const pl = d.single ? { x: d.x, y: d.y, rot: d.rot } : { ...m.placement, x: m.placement.x + d.x, y: m.placement.y + d.y };
      const s = G.findVertexSnap(m.piece, pl, scene, snapUnits());
      if (s && (!snap || s.d < snap.d)) snap = s;
    }
    layers.snap.replaceChildren();
    if (snap) layers.snap.appendChild(svgEl("circle", { cx: snap.target[0], cy: snap.target[1], r: 9 / S.pxPerUnit, class: "snap-marker" }));
  }
  function rotateDrag(dir = 1) {
    const d = S.drag; if (!d || !d.single) { if (d) setMsg("Birim hücre döndürülmez; yalnızca ötelenir."); return; }
    d.rot = G.norm360(d.rot + dir * G.familyStep(d.group[0].piece.family));
    updateDrag();
  }
  function cancelDrag(restore) {
    const d = S.drag; if (!d) return;
    d.off?.(); d.g.remove(); layers.snap.replaceChildren(); S.drag = null;
    if (restore) returnToOrigin(d);
  }
  function returnToOrigin(d) {
    if (d.origin.type === "tray") d.origin.item.count++;
    else if (d.origin.type === "scene") S.placed.push(...d.origin.entries);
    renderPlaced(); renderTray(); renderLabels();
  }
  function finishDrag(inside) {
    const d = S.drag; if (!d) return;
    d.off?.(); d.g.remove(); layers.snap.replaceChildren(); S.drag = null;
    if (!inside) { if (d.origin.type === "tray") d.origin.item.count++; else { const t = S.tray.find((i) => (d.single ? i.pieceId === d.group[0].piece.id : i.cell)); if (t) t.count++; } renderPlaced(); renderTray(); renderLabels(); setMsg("Parça kutuya döndü."); return; }
    const scene = scenePlaced();
    S.attempts++;
    if (d.single) {
      const piece = d.group[0].piece;
      const res = G.resolvePlacement(piece, { x: d.x, y: d.y, rot: d.rot }, scene, { snapDist: snapUnits() });
      if (piece.family !== homeFamily(res.placement)) S.wrong++;
      if (res.overlap) { returnToOrigin(d); setMsg(overlapMessage(piece, res.placement, scene), "bad"); shake(); return; }
      const entry = { uid: S.uid++, pieceId: piece.id, ...res.placement };
      S.placed.push(entry);
      S.highlight = entry.uid;
      const m = placementMessage(piece, res.placement, scene);
      setMsg(m.text, m.cls);
    } else {
      const res = G.resolveGroupPlacement(d.group, { x: d.x, y: d.y }, scene, { snapDist: snapUnits() });
      if (res.overlap) { returnToOrigin(d); setMsg("Hücre başka parçaların üstüne bindi. Yıldız ucunu komşu yıldızın ucuna değdir.", "bad"); shake(); return; }
      const key = S.uid++;
      for (const m of d.group) S.placed.push({ uid: S.uid++, cellKey: key, cellOffset: res.offset, pieceId: m.piece.id, x: m.placement.x + res.offset.x, y: m.placement.y + res.offset.y, rot: m.placement.rot });
      S.highlight = key;
      const lat = G.latticeCoords([res.offset.x, res.offset.y], level.translation.a, level.translation.b);
      setMsg(lat ? `Kopya kafese oturdu: ${lat.i}·a + ${lat.j}·b.` : "Kopya yerleşti ama kafese oturmadı: öteleme, iki yıldız merkezini birleştiren vektör olmalı.", lat ? "ok" : "warn");
    }
    renderPlaced(); renderTray(); renderLabels();
    if (isComplete()) complete();
  }
  function shake() { svg.classList.remove("shake"); void svg.offsetWidth; svg.classList.add("shake"); }

  function placementMessage(piece, placement, scene) {
    const mine = G.placedPoints(piece, placement);
    const at = G.evaluateVertices([...scene, { piece, placement }]).filter((v) => mine.some((p) => G.dist(p, v.vertex) <= G.VERTEX_TOL));
    if (!at.length) return { text: "Parça yerleşti ama hiçbir köşeye değmiyor. Köşeyi bir köşeye yaklaştır.", cls: "" };
    const tam = at.filter((v) => v.state === "tam"), gaps = at.filter((v) => v.state === "bosluk").sort((a, b) => a.gap - b.gap);
    if (tam.length) return { text: `Tam oturdu: ${sumStr(tam[0])} ✓${gaps.length ? " Kenardaki boşluklar komşu parçaları bekliyor." : ""}`, cls: "ok" };
    const g = gaps[0];
    let text = `${sumStr(g)} — ${fmt(g.gap)}° açık kaldı.`;
    if (profile.familyNote && piece.family !== homeFamily(placement)) text += ` Bu parça ${FAMILY_LABEL[piece.family].toLowerCase()} sistemden; açıları ${G.familyStep(piece.family)}° adımıyla gider.`;
    return { text, cls: "warn" };
  }
  function overlapMessage(piece, placement, scene) {
    const mine = G.placedPoints(piece, placement);
    const over = G.evaluateVertices([...scene, { piece, placement }]).find((v) => v.state === "cakisma" && mine.some((p) => G.dist(p, v.vertex) <= G.VERTEX_TOL));
    if (over) return `${sumStr(over)} — 360'ı ${fmt(-over.gap)}° aşıyor; parça üst üste bindi, kutuya döndü.`;
    // köşede aşım yok ama parça komşusuna biniyor: değdiği en dar boşluğu açıyla anlat
    const own = scene.length;
    const tight = G.evaluateVertices([...scene, { piece, placement }])
      .filter((v) => v.state !== "tam" && v.parts.some((pt) => pt.pieceIndex === own) && v.parts.some((pt) => pt.pieceIndex !== own))
      .map((v) => ({ v, others: v.parts.filter((pt) => pt.pieceIndex !== own).reduce((s, pt) => s + pt.angle, 0), mine: v.parts.find((pt) => pt.pieceIndex === own).angle }))
      .filter((x) => 360 - x.others < 180) // yalnızca dar köşeler; açık uçta "288° istiyor" demek öğretmez
      .sort((a, b) => b.others - a.others)[0];
    const note = profile.familyNote && piece.family !== homeFamily(placement) ? ` Bu parça ${FAMILY_LABEL[piece.family].toLowerCase()} sistemden.` : "";
    if (tight) return `${sumStr(tight.v)} — boşluk ${fmt(360 - tight.others)}° istiyor, bu parçanın köşesi ${fmt(tight.mine)}°. Parça komşusuna bindi, kutuya döndü.${note}`;
    return `Parça başka bir parçanın üstüne bindi, kutuya döndü. Boş bir köşeye bırak.${note}`;
  }

  // ---- tamamlama ----
  function isComplete() {
    if (isCell) {
      const got = new Set();
      const keys = [...new Set(S.placed.map((p) => p.cellKey).filter((k) => k != null))];
      for (const k of keys) {
        const e = S.placed.find((p) => p.cellKey === k);
        const lat = G.latticeCoords([e.cellOffset.x, e.cellOffset.y], level.translation.a, level.translation.b);
        if (!lat) return false;
        got.add(`${lat.i},${lat.j}`);
      }
      return got.size === cellTargets.length && cellTargets.every((c) => got.has(`${c.i},${c.j}`));
    }
    return G.matchesTargets(S.placed.map(({ pieceId, x, y, rot }) => ({ pieceId, x, y, rot })), level.targets, isMix ? 1 : level.family, byId);
  }
  function complete() {
    S.completed = true;
    const seconds = Math.round((Date.now() - S.start) / 1000);
    const prev = ctx.state.progress[level.id];
    ctx.state.progress[level.id] = { completed: true, attempts: S.attempts, seconds: prev?.completed ? Math.min(prev.seconds, seconds) : seconds, difficulty: diff, ts: Date.now() };
    ctx.log(sessionRecord(true, seconds));
    ctx.saveState();
    svg.classList.add("done");
    S.highlight = null; renderLabels();
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="done-t">
      <p class="eyebrow">Keşif</p><h2 id="done-t">Oturdu.</h2>
      <p class="disc">${esc(level.discovery)}</p>
      ${storyCardHTML(cards[level.card])}
      <p class="stats">${S.attempts} deneme · ${mmss(seconds)}${S.wrong ? ` · ${S.wrong} yanlış aile` : ""}${S.hints ? ` · ${S.hints} ipucu` : ""}</p>
      <div class="actions">
        ${next ? `<a class="btn primary" href="#kur/${next.id}">Sonraki seviye →</a>` : `<a class="btn primary" href="#kur">Seviyeler</a>`}
        <button type="button" class="btn" data-act="to-lines">Çizgiye dönüştür</button>
        <button type="button" class="btn" data-act="replay">Tekrar oyna</button>
        <a class="btn" href="#home">Lonca</a>
      </div></div>`;
    $("[data-act=to-lines]", overlay).addEventListener("click", () => { overlay.hidden = true; setLines(true); });
    $("[data-act=replay]", overlay).addEventListener("click", () => { overlay.hidden = true; svg.classList.remove("done"); reset(); });
    $(".btn.primary", overlay).focus();
  }
  function sessionRecord(completed, seconds) {
    return { ts: new Date().toISOString(), mode: "kur", family: isMix ? level.families.join("+") : level.family, level: level.id, difficulty: diff, attempts: S.attempts, wrongFamilyAttempts: S.wrong, seconds, completed, hintsUsed: S.hints };
  }
  function reset() {
    cancelDrag(false);
    S.placed = []; S.highlight = null; S.completed = false; S.start = Date.now(); S.attempts = 0; S.wrong = 0; S.hints = 0;
    fillTray(); renderAll();
    setMsg("Tahta temizlendi.");
  }

  // ---- olaylar ----
  trayEl.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".tray-item"); if (!b || e.button > 0) return;
    const item = S.tray[+b.dataset.idx]; if (!item || item.count <= 0) return;
    e.preventDefault();
    item.count--; renderTray();
    const [bx, by] = toBoard(e.clientX, e.clientY);
    const grab = e.pointerType === "touch" ? [0, TOUCH_LIFT] : [0, 0];
    startDrag({ group: groupFor(item), origin: { type: "tray", item }, x: bx - grab[0], y: by - grab[1], grab, pointer: { el: trayEl, id: e.pointerId } });
  });
  trayEl.addEventListener("keydown", (e) => {
    const b = e.target.closest(".tray-item"); if (!b || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    const item = S.tray[+b.dataset.idx]; if (!item || item.count <= 0) return;
    item.count--; renderTray();
    startDrag({ group: groupFor(item), origin: { type: "tray", item }, x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 });
    setMsg("Klavye: ok tuşları taşır (Shift: büyük adım), R döndürür, Enter bırakır, Esc vazgeçer.");
  });
  layers.placed.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-uid]"); if (!g || e.button > 0 || S.completed) return;
    e.preventDefault();
    pickFromScene(+g.dataset.uid, e);
  });
  layers.placed.addEventListener("dblclick", (e) => {
    const g = e.target.closest("[data-uid]"); if (!g || S.completed) return;
    rotateInPlace(+g.dataset.uid);
  });
  layers.placed.addEventListener("keydown", (e) => {
    const g = e.target.closest("[data-uid]"); if (!g || S.completed) return;
    const uid = +g.dataset.uid;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickFromScene(uid, null); setMsg("Klavye: ok tuşları taşır, R döndürür, Enter bırakır, Esc geri koyar."); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); const entries = takeFromScene(uid); const t = S.tray.find((i) => (entries[0].cellKey != null ? i.cell : i.pieceId === entries[0].pieceId)); if (t) t.count++; renderPlaced(); renderTray(); renderLabels(); setMsg("Parça kutuya döndü."); }
    else if (e.key.toLowerCase() === "r") { e.preventDefault(); rotateInPlace(uid); }
  });
  function takeFromScene(uid) {
    const e = S.placed.find((p) => p.uid === uid); if (!e) return [];
    const entries = e.cellKey != null ? S.placed.filter((p) => p.cellKey === e.cellKey) : [e];
    S.placed = S.placed.filter((p) => !entries.includes(p));
    return entries;
  }
  function pickFromScene(uid, e) {
    const entries = takeFromScene(uid); if (!entries.length) return;
    S.highlight = null; renderPlaced(); renderLabels();
    const first = entries[0];
    let group, x, y, rot = 0;
    if (first.cellKey != null) { group = cellPieces; x = first.cellOffset.x; y = first.cellOffset.y; }
    else { group = [{ piece: byId[first.pieceId], placement: { x: 0, y: 0, rot: 0 } }]; x = first.x; y = first.y; rot = first.rot; }
    let grab = [0, 0], pointer = null;
    if (e) { const [bx, by] = toBoard(e.clientX, e.clientY); grab = [bx - x, by - y]; pointer = { el: svg, id: e.pointerId }; }
    startDrag({ group, origin: { type: "scene", entries }, x, y, rot, grab, pointer });
  }
  function rotateInPlace(uid) {
    const e = S.placed.find((p) => p.uid === uid); if (!e) return;
    if (e.cellKey != null) { setMsg("Birim hücre döndürülmez; yalnızca ötelenir."); return; }
    const piece = byId[e.pieceId];
    const scene = scenePlaced(new Set([uid]));
    const rot = G.norm360(e.rot + G.familyStep(piece.family));
    const pl = { x: e.x, y: e.y, rot };
    if (G.anyOverlap(piece, pl, scene) >= 0 || G.evaluateVertices([...scene, { piece, placement: pl }]).some((v) => v.state === "cakisma")) { setMsg("Bu dönüşte parça komşusuna biner. Önce parçayı al, sonra döndür.", "bad"); shake(); return; }
    Object.assign(e, pl); S.highlight = uid; S.attempts++;
    renderPlaced(); renderLabels();
    const m = placementMessage(piece, pl, scene); setMsg(m.text, m.cls);
    if (isComplete()) complete();
  }
  root.querySelector(".toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "rotate") { if (S.drag) rotateDrag(); else setMsg("Önce bir parçayı tut (sürükle ya da Enter), sonra döndür. Tahtadaki parçayı çift tıklayarak da döndürebilirsin."); }
    else if (act === "lines") setLines(!S.lines);
    else if (act === "labels") { S.labels = !S.labels; b.setAttribute("aria-pressed", S.labels); renderLabels(); }
    else if (act === "hint") { S.hints++; setMsg(profile.hint || "Köşedeki açıları topla: 360'a ne kadar kaldı?", "hint"); if (profile.ghost) { renderGhosts(true); setTimeout(() => renderGhosts(false), 4000); } }
    else if (act === "reset") reset();
  });
  const onKey = (e) => {
    if (e.target && e.target.matches && e.target.matches("input, textarea, [contenteditable]")) return;
    const d = S.drag;
    if (e.key.toLowerCase() === "r" && d) { e.preventDefault(); rotateDrag(e.shiftKey ? -1 : 1); return; }
    if (!d || d.pointer) return; // klavye modu yalnızca işaretçisiz sürüklemede
    const step = e.shiftKey ? KB_STEP * 5 : KB_STEP;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) { e.preventDefault(); d.x += moves[e.key][0]; d.y += moves[e.key][1]; updateDrag(); }
    else if (e.key === "Enter") { e.preventDefault(); finishDrag(true); }
    else if (e.key === "Escape") { e.preventDefault(); cancelDrag(true); setMsg("Vazgeçildi."); }
  };
  window.addEventListener("keydown", onKey);
  svg.addEventListener("dragstart", (e) => e.preventDefault());
  const ro = new ResizeObserver(updateScale);
  ro.observe(svg);

  renderAll();
  updateScale();

  return () => {
    window.removeEventListener("keydown", onKey);
    ro.disconnect();
    cancelDrag(false);
    if (!S.completed && S.attempts > 0) { ctx.log(sessionRecord(false, Math.round((Date.now() - S.start) / 1000))); ctx.saveState(); }
  };
}

/** n×n kafes konumları (orijin hücresi hariç), merkeze yakın blok. */
function gridOffsets(n, { a, b }) {
  const lo = -Math.floor((n - 1) / 2), out = [];
  for (let i = lo; i < lo + n; i++) for (let j = lo; j < lo + n; j++) {
    if (i === 0 && j === 0) continue;
    out.push({ i, j, x: i * a[0] + j * b[0], y: i * a[1] + j * b[1] });
  }
  return out;
}

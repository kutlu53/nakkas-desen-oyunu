// Usta — Yarat: boş tuval, parça kutusu, simetri aynası (n-kat dönme), boya, geri al, PNG ve yerel galeri.
// Yerleşim ve yapışma Kur ile aynı geometriden (../geometry.js); burada yalnızca serbest tuval ve araçlar var.
import { loadPieces, pieceElement, pieceThumb, FAMILY_LABEL } from "../pieces.js";
import * as G from "../geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const SNAP_PX = 22, TOUCH_LIFT = 0.45;
const VIEW = { x: -5, y: -3.75, w: 10, h: 7.5 };
const MIRRORS = [0, 6, 8, 10, 12];
const PALETTE = [["kobalt", "#1f2a7a"], ["firuze", "#6aa6c8"], ["beyaz", "#ece9e2"], ["hardal", "#e2a92b"], ["kiremit", "#b8392e"], ["yeşil", "#2e7d6b"]];
const GALLERY_MAX = 30, UNDO_MAX = 60;
const TASKS = [
  { id: "tek-aile", title: "Tek aile", desc: "En az 8 parça, hepsi aynı aileden", test: (p, ctx) => p.length >= 8 && new Set(p.map((x) => ctx.byId[x.pieceId].family)).size === 1 },
  { id: "uc-renk", title: "Üç renk", desc: "En az 8 parça, tam üç renk", test: (p) => p.length >= 8 && new Set(p.map((x) => x.color)).size === 3 },
  { id: "tam-kose", title: "Dört tam köşe", desc: "En az dört köşede açılar 360'ı bulsun", test: (p, ctx) => ctx.tamCount() >= 4 },
  { id: "ayna", title: "Simetri aynası", desc: "Aynayla en az 16 parça", test: (p, ctx) => ctx.mirror > 1 && p.length >= 16 },
];

const $ = (s, el = document) => el.querySelector(s);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tf = ({ x, y, rot }) => `translate(${x} ${y}) rotate(${rot || 0})`;
const fmt = (n) => String(Math.round(n * 10) / 10);

/** Yerleşimleri bağımsız bir SVG dizesine çevir (PNG ve galeri küçük resmi için; CSS değişkeni yok). */
export function sceneSVG(placed, byId, { width = 800, height = 600, bg = "#f1ede4" } = {}) {
  const paths = placed.map((p) => `<path d="${G.toPath(G.placedPoints(byId[p.pieceId], p))}" fill="${p.color}" stroke="#24231f" stroke-width="0.03" stroke-linejoin="round"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" width="${width}" height="${height}"><rect x="${VIEW.x}" y="${VIEW.y}" width="${VIEW.w}" height="${VIEW.h}" fill="${bg}"/>${paths}</svg>`;
}

export async function mount(root, ctx) {
  const { list, byId } = await loadPieces();
  ctx.state.gallery ||= [];
  ctx.state.badges ||= {};
  const S = { placed: [], uid: 1, gid: 1, mirror: 0, family: 8, color: null, sel: null, drag: null, undo: [], labels: false, pxPerUnit: 80, start: Date.now(), maxPieces: 0, families: new Set(), changed: false };

  root.innerHTML = `
    <header class="mode-head">
      <a class="back" href="#home">← Lonca</a>
      <p class="eyebrow">Usta · ${ctx.difficulty}</p>
      <h1>Yarat</h1>
      <p class="story">Usta: 'Artık kendi desenini kur. Ayna açıksa koyduğun her taş merkezin çevresinde çoğalır.'</p>
    </header>
    <section class="play yarat">
      <div class="toolbar" role="toolbar" aria-label="Araçlar">
        <span class="tb-label">Ayna</span>${MIRRORS.map((n) => `<button type="button" data-mirror="${n}" aria-pressed="${n === 0}">${n ? `${n}×` : "Kapalı"}</button>`).join("")}
        <button type="button" data-act="rotate" title="Tutulan parçayı döndür (R)">↻</button>
        <button type="button" data-act="delete" title="Seçili grubu sil">Sil</button>
        <button type="button" data-act="undo">Geri al</button>
        <button type="button" data-act="clear">Temizle</button>
        <button type="button" data-act="labels" aria-pressed="false">Açı etiketleri</button>
      </div>
      <p class="msg" aria-live="polite">Kutudan bir parça sürükle. Ayna açıksa parça merkezin çevresinde çoğalır.</p>
      <svg class="board" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Tuval">
        <g class="guides"></g><g class="placed"></g><g class="labels"></g><g class="snap"></g><g class="drag"></g>
      </svg>
      <aside class="tray side">
        <div class="fam-tabs" role="tablist" aria-label="Aile">${[6, 8, 10, 12].map((f) => `<button type="button" role="tab" data-fam="${f}" aria-selected="${f === S.family}">${f}</button>`).join("")}</div>
        <div class="tray-items" aria-label="Parça kutusu"></div>
        <div class="palette" aria-label="Boya">${PALETTE.map(([n, c]) => `<button type="button" data-color="${c}" title="${n}" aria-label="${n}" style="--sw:${c}"></button>`).join("")}</div>
        <ul class="tasks" aria-label="Görevler"></ul>
        <div class="out">
          <button type="button" class="btn" data-act="png">PNG indir</button>
          <button type="button" class="btn" data-act="save">Galeriye kaydet</button>
        </div>
      </aside>
    </section>
    <section class="gallery-sec"><h2>Galerin</h2><div class="gallery"></div></section>`;

  const svg = $(".board", root), msgEl = $(".msg", root), trayEl = $(".tray-items", root);
  const layers = Object.fromEntries(["guides", "placed", "labels", "snap", "drag"].map((k) => [k, $(`.${k}`, svg)]));
  const setMsg = (t, cls = "") => { msgEl.textContent = t; msgEl.className = `msg ${cls}`; };
  const toBoard = (cx, cy) => { const p = new DOMPoint(cx, cy).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; };
  const insideBoard = (cx, cy) => { const r = svg.getBoundingClientRect(); return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom; };
  const snapUnits = () => Math.min(0.25, Math.max(0.08, SNAP_PX / S.pxPerUnit));
  const scene = (exclude = new Set()) => S.placed.filter((p) => !exclude.has(p.uid)).map((p) => ({ piece: byId[p.pieceId], placement: p }));
  const snapshot = () => { S.undo.push(S.placed.map((p) => ({ ...p }))); if (S.undo.length > UNDO_MAX) S.undo.shift(); };
  const tamCount = () => G.evaluateVertices(scene()).filter((v) => v.state === "tam").length;
  const updateScale = () => { const r = svg.getBoundingClientRect(); if (r.width) S.pxPerUnit = Math.min(r.width / VIEW.w, r.height / VIEW.h); renderLabels(); };

  // ---- çizim ----
  function renderGuides() {
    const g = [svgEl("circle", { cx: 0, cy: 0, r: 0.06, class: "center" })];
    if (S.mirror > 1) for (let k = 0; k < S.mirror; k++) { const t = (k * 360) / S.mirror * Math.PI / 180 - Math.PI / 2; g.push(svgEl("line", { x1: 0, y1: 0, x2: 6 * Math.cos(t), y2: 6 * Math.sin(t), class: "ray" })); }
    layers.guides.replaceChildren(...g);
  }
  function renderPlaced() {
    layers.placed.replaceChildren(...S.placed.map((p) => {
      const g = svgEl("g", { transform: tf(p), class: `piece placed ${S.sel === p.gid ? "sel" : ""}`, tabindex: "0", role: "button", "aria-label": `${byId[p.pieceId].name}; seçmek için Enter` });
      g.dataset.uid = p.uid;
      const el = pieceElement(byId[p.pieceId]); el.querySelector("path").setAttribute("fill", p.color); g.appendChild(el);
      return g;
    }));
  }
  function renderLabels() {
    if (!S.labels) { layers.labels.replaceChildren(); return; }
    const fs = 11 / S.pxPerUnit, r = 4 / S.pxPerUnit, frag = document.createDocumentFragment();
    for (const v of G.evaluateVertices(scene())) {
      const [x, y] = v.vertex;
      frag.appendChild(svgEl("circle", { cx: x, cy: y, r, class: `vertex vertex-${v.state}` }));
      if (v.state === "tam") continue;
      const t = svgEl("text", { x: x + r * 1.5, y: y - r * 1.5, "font-size": fs, class: `vlabel vlabel-${v.state}` });
      t.textContent = v.state === "bosluk" ? `${fmt(v.gap)}° açık` : "çakışma";
      frag.appendChild(t);
    }
    layers.labels.replaceChildren(frag);
  }
  function renderTray() {
    trayEl.replaceChildren(...list.filter((p) => p.family === S.family).map((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tray-item"; b.dataset.id = p.id;
      b.setAttribute("aria-label", `${p.name}. Sürükle ya da Enter ile merkeze koy.`);
      b.appendChild(pieceThumb(p, 56));
      b.insertAdjacentHTML("beforeend", `<span class="nm">${esc(p.name)}</span>`);
      return b;
    }));
  }
  function renderTasks() {
    $(".tasks", root).innerHTML = TASKS.map((t) => {
      const done = !!ctx.state.badges[`yarat-${t.id}`];
      return `<li class="${done ? "done" : ""}"><strong>${done ? "✓ " : ""}${t.title}</strong><small>${t.desc}</small></li>`;
    }).join("");
  }
  function checkTasks() {
    const c = { byId, mirror: S.mirror, tamCount };
    const fresh = TASKS.filter((t) => !ctx.state.badges[`yarat-${t.id}`] && t.test(S.placed, c));
    for (const t of fresh) ctx.state.badges[`yarat-${t.id}`] = Date.now();
    if (fresh.length) { ctx.saveState(); setMsg(`${msgEl.textContent} Rozet kazandın: ${fresh.map((t) => t.title).join(", ")}.`, "ok"); }
    renderTasks();
  }
  function renderGallery() {
    const el = $(".gallery", root);
    if (!ctx.state.gallery.length) { el.innerHTML = `<p class="lead">Henüz kayıt yok. "Galeriye kaydet" desenini bu cihazda saklar.</p>`; return; }
    el.innerHTML = ctx.state.gallery.map((g, i) => `<figure class="g-item">${sceneSVG(g.pieces.filter((p) => byId[p.pieceId]), byId, { width: 160, height: 120 })}
      <figcaption>${new Date(g.ts).toLocaleDateString("tr-TR")} · ${g.pieces.length} parça${g.symmetry > 1 ? ` · ${g.symmetry}× ayna` : ""}</figcaption>
      <div class="g-act"><button type="button" class="btn" data-load="${i}">Aç</button><button type="button" class="btn" data-del="${i}">Sil</button></div></figure>`).join("");
  }
  function renderAll() { renderGuides(); renderPlaced(); renderLabels(); renderTasks(); }

  // ---- yerleştirme (ayna kopyalarıyla) ----
  const rotateAbout = (pl, deg) => { const [x, y] = G.transformPoint([pl.x, pl.y], { x: 0, y: 0, rot: deg }); return { x, y, rot: G.norm360((pl.rot || 0) + deg) }; };
  function place(piece, pl) {
    const sc = scene();
    const res = G.resolvePlacement(piece, pl, sc, { snapDist: snapUnits() });
    if (res.overlap) { setMsg("Parça başka bir parçanın üstüne bindi; boş bir yere bırak.", "bad"); return 0; }
    const copies = [res.placement];
    if (S.mirror > 1) for (let k = 1; k < S.mirror; k++) copies.push(rotateAbout(res.placement, (k * 360) / S.mirror));
    const accepted = [];
    for (const c of copies) {
      const pts = G.placedPoints(piece, c);
      const dup = [...S.placed, ...accepted].some((p) => p.pieceId === piece.id && G.samePointSet(G.placedPoints(byId[p.pieceId], p), pts, 0.02));
      if (dup) continue;
      const all = [...sc, ...accepted.map((a) => ({ piece, placement: a }))];
      if (G.anyOverlap(piece, c, all) >= 0) continue;
      accepted.push(c);
    }
    if (!accepted.length) { setMsg("Bu yere sığmadı.", "bad"); return 0; }
    snapshot();
    const gid = S.gid++, color = S.color || piece.color;
    for (const c of accepted) S.placed.push({ uid: S.uid++, gid, pieceId: piece.id, x: c.x, y: c.y, rot: c.rot, color });
    S.families.add(piece.family); S.maxPieces = Math.max(S.maxPieces, S.placed.length); S.changed = true;
    S.sel = gid;
    const skipped = copies.length - accepted.length;
    const tam = G.evaluateVertices(scene()).filter((v) => v.state === "tam" && accepted.some((a) => G.placedPoints(piece, a).some((q) => G.dist(q, v.vertex) <= G.VERTEX_TOL)));
    setMsg(`${accepted.length > 1 ? `${accepted.length} kopya yerleşti` : "Parça yerleşti"}${skipped ? ` (${skipped} kopya yer bulamadı)` : ""}.${tam.length ? ` Tam oturan köşe: ${tam[0].parts.map((p) => fmt(p.angle)).join(" + ")} = 360 ✓` : ""}`, tam.length ? "ok" : "");
    renderPlaced(); renderLabels(); checkTasks();
    return accepted.length;
  }

  // ---- sürükleme (kutudan) ----
  function startDrag(piece, e) {
    cancelDrag();
    const g = svgEl("g", { class: "drag-g" }); g.appendChild(pieceElement(piece)); layers.drag.appendChild(g);
    const lift = e.pointerType === "touch" ? TOUCH_LIFT : 0;
    S.drag = { piece, x: 0, y: 0, rot: 0, lift, g, id: e.pointerId };
    moveDrag(e.clientX, e.clientY);
    try { trayEl.setPointerCapture(e.pointerId); } catch {}
  }
  function moveDrag(cx, cy) {
    const d = S.drag; if (!d) return;
    const [bx, by] = toBoard(cx, cy); d.x = bx; d.y = by - d.lift;
    d.g.setAttribute("transform", tf(d));
    const s = G.findVertexSnap(d.piece, d, scene(), snapUnits());
    layers.snap.replaceChildren(...(s ? [svgEl("circle", { cx: s.target[0], cy: s.target[1], r: 9 / S.pxPerUnit, class: "snap-marker" })] : []));
  }
  function cancelDrag() { if (!S.drag) return; S.drag.g.remove(); layers.snap.replaceChildren(); S.drag = null; }
  trayEl.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".tray-item"); if (!b || e.button > 0) return;
    e.preventDefault(); startDrag(byId[b.dataset.id], e);
  });
  trayEl.addEventListener("pointermove", (e) => { if (S.drag && e.pointerId === S.drag.id) moveDrag(e.clientX, e.clientY); });
  trayEl.addEventListener("pointerup", (e) => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const inside = insideBoard(e.clientX, e.clientY);
    cancelDrag();
    if (inside) place(d.piece, { x: d.x, y: d.y, rot: d.rot }); else setMsg("Parça kutuya döndü.");
  });
  trayEl.addEventListener("pointercancel", cancelDrag);
  trayEl.addEventListener("keydown", (e) => {
    const b = e.target.closest(".tray-item"); if (!b || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); place(byId[b.dataset.id], { x: 0, y: -1.5, rot: 0 });
  });
  const onKey = (e) => { if (e.key.toLowerCase() === "r" && S.drag) { e.preventDefault(); S.drag.rot = G.norm360(S.drag.rot + G.familyStep(S.drag.piece.family) * (e.shiftKey ? -1 : 1)); S.drag.g.setAttribute("transform", tf(S.drag)); } };
  window.addEventListener("keydown", onKey);

  // ---- seçim, boya, araçlar ----
  const selectAt = (uid) => { const p = S.placed.find((x) => x.uid === uid); S.sel = p ? p.gid : null; renderPlaced(); if (p) setMsg(`Seçildi: ${byId[p.pieceId].name}${S.placed.filter((x) => x.gid === p.gid).length > 1 ? " ve ayna kopyaları" : ""}. Boyamak için bir renge dokun, silmek için Sil.`); };
  layers.placed.addEventListener("pointerdown", (e) => { const g = e.target.closest("[data-uid]"); if (g) { e.preventDefault(); selectAt(+g.dataset.uid); } });
  layers.placed.addEventListener("keydown", (e) => { const g = e.target.closest("[data-uid]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectAt(+g.dataset.uid); } else if (g && e.key === "Delete") { selectAt(+g.dataset.uid); removeSel(); } });
  function removeSel() {
    if (S.sel == null) { setMsg("Önce tuvalde bir parçaya dokunarak seç."); return; }
    snapshot(); S.placed = S.placed.filter((p) => p.gid !== S.sel); S.sel = null; S.changed = true;
    renderPlaced(); renderLabels(); setMsg("Silindi."); checkTasks();
  }
  root.querySelector(".palette").addEventListener("click", (e) => {
    const b = e.target.closest("[data-color]"); if (!b) return;
    root.querySelectorAll(".palette [data-color]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    S.color = b.dataset.color;
    if (S.sel != null) { snapshot(); for (const p of S.placed) if (p.gid === S.sel) p.color = S.color; renderPlaced(); setMsg("Boyandı. Yeni parçalar da bu renkte gelecek."); checkTasks(); }
    else setMsg("Yeni parçalar bu renkte gelecek. Var olan bir parçayı boyamak için önce onu seç.");
  });
  root.querySelector(".fam-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-fam]"); if (!b) return;
    S.family = +b.dataset.fam;
    root.querySelectorAll(".fam-tabs [data-fam]").forEach((x) => x.setAttribute("aria-selected", x === b));
    renderTray(); setMsg(`${FAMILY_LABEL[S.family]} sistemin parçaları. Döndürme adımı ${G.familyStep(S.family)}°.`);
  });
  root.querySelector(".toolbar").addEventListener("click", (e) => {
    const m = e.target.closest("[data-mirror]");
    if (m) {
      S.mirror = +m.dataset.mirror;
      root.querySelectorAll("[data-mirror]").forEach((x) => x.setAttribute("aria-pressed", x === m));
      renderGuides(); setMsg(S.mirror ? `Ayna ${S.mirror}×: her parça merkez çevresinde ${S.mirror} kez, ${360 / S.mirror}° arayla çoğalır.` : "Ayna kapalı.");
      return;
    }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "rotate") { if (S.drag) { S.drag.rot = G.norm360(S.drag.rot + G.familyStep(S.drag.piece.family)); S.drag.g.setAttribute("transform", tf(S.drag)); } else setMsg("Parçayı sürüklerken R ile döndür."); }
    else if (act === "delete") removeSel();
    else if (act === "undo") { const prev = S.undo.pop(); if (!prev) { setMsg("Geri alınacak bir şey yok."); return; } S.placed = prev; S.sel = null; renderPlaced(); renderLabels(); setMsg("Geri alındı."); }
    else if (act === "clear") { if (!S.placed.length) return; snapshot(); S.placed = []; S.sel = null; renderPlaced(); renderLabels(); setMsg("Tuval temizlendi. Geri al ile dönebilirsin."); }
    else if (act === "labels") { S.labels = !S.labels; b.setAttribute("aria-pressed", S.labels); renderLabels(); }
  });

  // ---- çıktı ----
  async function exportPNG() {
    if (!S.placed.length) { setMsg("Tuval boş."); return null; }
    const img = new Image(), url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sceneSVG(S.placed, byId, { width: 1600, height: 1200 }));
    await new Promise((ok, fail) => { img.onload = ok; img.onerror = fail; img.src = url; });
    const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 1200;
    cv.getContext("2d").drawImage(img, 0, 0);
    const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `nakkas-desen-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg("PNG indirildi.", "ok");
    return blob;
  }
  root.querySelector(".out").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "png") exportPNG().catch(() => setMsg("PNG oluşturulamadı.", "bad"));
    else if (b.dataset.act === "save") {
      if (!S.placed.length) { setMsg("Tuval boş."); return; }
      ctx.state.gallery.unshift({ ts: Date.now(), symmetry: S.mirror, pieces: S.placed.map(({ pieceId, x, y, rot, color }) => ({ pieceId, x: +x.toFixed(4), y: +y.toFixed(4), rot: +rot.toFixed(2), color })) });
      ctx.state.gallery.splice(GALLERY_MAX);
      ctx.saveState(); renderGallery(); setMsg("Galerine kaydedildi (bu cihazda).", "ok");
    }
  });
  $(".gallery", root).addEventListener("click", (e) => {
    const l = e.target.closest("[data-load]"), d = e.target.closest("[data-del]");
    if (l) {
      const g = ctx.state.gallery[+l.dataset.load]; snapshot();
      let gid = S.gid; S.placed = g.pieces.filter((p) => byId[p.pieceId]).map((p) => ({ ...p, uid: S.uid++, gid: gid++ })); S.gid = gid; S.sel = null;
      renderPlaced(); renderLabels(); setMsg("Galeriden açıldı.");
      svg.scrollIntoView?.({ block: "nearest" });
    } else if (d) { ctx.state.gallery.splice(+d.dataset.del, 1); ctx.saveState(); renderGallery(); }
  });

  const ro = new ResizeObserver(updateScale); ro.observe(svg);
  renderTray(); renderAll(); renderGallery(); updateScale();
  mount.exportPNG = exportPNG; // testler için

  return () => {
    window.removeEventListener("keydown", onKey); ro.disconnect(); cancelDrag();
    if (S.changed) {
      ctx.log({ ts: new Date().toISOString(), mode: "yarat", difficulty: ctx.difficulty, pieces: S.maxPieces, families: [...S.families].sort((a, b) => a - b), symmetry: S.mirror, seconds: Math.round((Date.now() - S.start) / 1000), completed: true, tasksDone: TASKS.filter((t) => ctx.state.badges[`yarat-${t.id}`]).map((t) => t.id) });
      ctx.saveState();
    }
  };
}

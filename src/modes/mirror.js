// Kalfa — Kur, aynalama seviyesi: Topkapı Tomarı'ndaki gibi en küçük birimi kenarlarından aynala ya da ötele.
// Veri: data/levels.json → unit, lattice, goal (tool: "mirror"). Dönüşüm matematiği: ../geometry.js (saf).
import { pieceElement, FAMILY_LABEL } from "../pieces.js";
import { storyCardHTML } from "../cards.js";
import * as G from "../geometry.js";
import { play } from "../sound.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const BAD_MS = 1600;      // kırık kopya bu kadar görünür, sonra geri alınır
const HIT_PX = 44;        // kenar tutamacının dokunma kalınlığı
const EPS = 1e-6;
const EDGES = [
  { id: "right", label: "Sağ kenar", axis: "x", side: "max" },
  { id: "bottom", label: "Alt kenar", axis: "y", side: "max" },
  { id: "left", label: "Sol kenar", axis: "x", side: "min" },
  { id: "top", label: "Üst kenar", axis: "y", side: "min" },
];
const TOOL = { mirror: "aynala", translate: "ötele" };

const $ = (s, el = document) => el.querySelector(s);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function renderMirror(root, ctx, level, levels, byId, cards = {}) {
  const diff = ctx.difficulty, coach = diff === "ortaokul";
  const [ux, uy, uw, uh] = level.unit.rect;
  const [gx, gy, gw, gh] = level.goal[diff] || level.goal.ortaokul;
  const { origin, a, b } = level.lattice;
  const famLevels = levels.filter((l) => l.family === level.family).sort((p, q) => p.order - q.order);
  const numbered = famLevels.filter((l) => l.order > 0).length;
  const next = famLevels.find((l) => l.order > level.order);
  const clipId = `unit-clip-${level.id}`;

  // görünüm: hedef alan + pay, 4:3
  const pad = 0.45, vb = { x: gx - pad, y: gy - pad, w: gw + 2 * pad, h: gh + 2 * pad };
  if (vb.w / vb.h < 4 / 3) { const w = (vb.h * 4) / 3; vb.x -= (w - vb.w) / 2; vb.w = w; } else { const h = (vb.w * 3) / 4; vb.y -= (h - vb.h) / 2; vb.h = h; }

  const S = { tiles: [G.IDENTITY], region: [ux, uy, ux + uw, uy + uh], history: [], tool: "mirror", bad: null, cellReached: false, pulse: false, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false, pxPerUnit: 100, timers: [] };

  root.innerHTML = `
    <header class="mode-head">
      <a class="back" href="#kur">← Seviyeler</a>
      <p class="eyebrow">Kalfa · ${FAMILY_LABEL[level.family]} sistem · ${level.order}/${numbered} · ${diff}</p>
      <h1>${esc(level.title)}</h1>
      <p class="story">${esc(level.story)}</p>
    </header>
    <section class="play mirror">
      <div class="toolbar" role="toolbar" aria-label="Araçlar">
        <button type="button" data-act="mirror" aria-pressed="true">⇋ Aynala</button>
        <button type="button" data-act="translate" aria-pressed="false">→ Ötele</button>
        <button type="button" data-act="undo">Geri al</button>
        <button type="button" data-act="hint">İpucu</button>
        <button type="button" data-act="reset">Sıfırla</button>
      </div>
      <p class="msg" aria-live="polite"></p>
      <svg class="board" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Tahta">
        <defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${ux}" y="${uy}" width="${uw}" height="${uh}"/></clipPath></defs>
        <rect class="area" x="${gx}" y="${gy}" width="${gw}" height="${gh}"/>
        <g class="tiles"></g><g class="handles"></g>
      </svg>
      <aside class="tray unit-box" aria-label="Birim">
        <svg viewBox="${ux - 0.08} ${uy - 0.08} ${uw + 0.16} ${uh + 0.16}" width="88" height="88" role="img" aria-label="Çeyrek kare birim"></svg>
        <p><strong>Tomar birimi</strong> Çeyrek yıldız + çeyrek haç. Kenarları yıldızın ve haçın ortasından geçer.</p>
      </aside>
    </section>
    <div class="overlay" hidden></div>`;

  const svg = $(".board", root), overlay = $(".overlay", root), msgEl = $(".msg", root);
  const tilesEl = $(".tiles", svg), handlesEl = $(".handles", svg);
  const setMsg = (text, cls = "") => { msgEl.textContent = text; msgEl.className = `msg ${cls}`; };
  const updateScale = () => {
    const r = svg.getBoundingClientRect();
    if (r.width && r.height) S.pxPerUnit = Math.min(r.width / vb.w, r.height / vb.h);
    renderHandles();
  };

  // ---- çizim ----
  function tileEl(T, cls = "") {
    const g = svgEl("g", { transform: `matrix(${T.join(" ")})`, class: `tile ${cls}` });
    const inner = svgEl("g", { "clip-path": `url(#${clipId})` });
    for (const p of level.unit.pieces) {
      const pg = svgEl("g", { transform: `translate(${p.x} ${p.y}) rotate(${p.rot || 0})` });
      pg.appendChild(pieceElement(byId[p.pieceId]));
      inner.appendChild(pg);
    }
    g.appendChild(inner);
    g.appendChild(svgEl("rect", { x: ux, y: uy, width: uw, height: uh, class: "seam" }));
    return g;
  }
  function renderTiles() {
    tilesEl.replaceChildren(...S.tiles.map((T, i) => tileEl(T, i === 0 ? "first" : "")), ...(S.bad || []).map((T) => tileEl(T, "bad")));
  }
  /** Kenara uygulanacak dönüşüm ve büyümüş alan. */
  function growth(edge, tool = S.tool) {
    const [x0, y0, x1, y1] = S.region, w = x1 - x0, h = y1 - y0, max = edge.side === "max";
    if (edge.axis === "x") return {
      M: tool === "mirror" ? G.reflectAcross("x", max ? x1 : x0) : G.translateBy(max ? w : -w, 0),
      region: max ? [x0, y0, x1 + w, y1] : [x0 - w, y0, x1, y1],
    };
    return {
      M: tool === "mirror" ? G.reflectAcross("y", max ? y1 : y0) : G.translateBy(0, max ? h : -h),
      region: max ? [x0, y0, x1, y1 + h] : [x0, y0 - h, x1, y1],
    };
  }
  const fits = ([x0, y0, x1, y1]) => x0 >= gx - EPS && y0 >= gy - EPS && x1 <= gx + gw + EPS && y1 <= gy + gh + EPS;
  function renderHandles() {
    if (S.completed) { handlesEl.replaceChildren(); return; }
    const [x0, y0, x1, y1] = S.region, hit = HIT_PX / S.pxPerUnit;
    handlesEl.replaceChildren(...EDGES.filter((e) => fits(growth(e).region)).map((e) => {
      const [p, q] = e.axis === "x" ? [[e.side === "max" ? x1 : x0, y0], [e.side === "max" ? x1 : x0, y1]] : [[x0, e.side === "max" ? y1 : y0], [x1, e.side === "max" ? y1 : y0]];
      const g = svgEl("g", { class: `handle ${coach || S.pulse ? "want" : ""}`, tabindex: "0", role: "button", "aria-label": `${e.label}: ${TOOL[S.tool]}` });
      g.dataset.edge = e.id;
      g.appendChild(svgEl("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: "edge-hit", "stroke-width": hit }));
      g.appendChild(svgEl("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: "edge" }));
      return g;
    }));
  }
  function renderAll() { renderTiles(); renderHandles(); }

  // ---- işlemler ----
  function grow(edgeId) {
    if (S.completed || S.bad) return;
    const edge = EDGES.find((e) => e.id === edgeId), { M, region } = growth(edge);
    if (!fits(region)) return;
    S.attempts++;
    const added = S.tiles.map((T) => G.affineCompose(M, T));
    if (!added.every((T) => G.preservesLattice(T, origin, a, b))) {
      S.wrong++;
      S.bad = added; renderTiles(); handlesEl.replaceChildren(); play("tok");
      setMsg(S.tool === "translate"
        ? "Çeyrek yıldızlar birleşmedi: bu birim ötelenince desen kırılır. Tomardaki birimler önce kenarlarından aynalanır."
        : "Bu ayna deseni bozdu.", "bad");
      S.timers.push(setTimeout(() => { S.bad = null; renderAll(); }, BAD_MS));
      return;
    }
    S.history.push({ tiles: S.tiles, region: S.region });
    S.tiles = [...S.tiles, ...added]; S.region = region;
    const [x0, y0, x1, y1] = region, cellNow = x1 - x0 >= Math.hypot(...a) - EPS && y1 - y0 >= Math.hypot(...b) - EPS;
    let text = S.tool === "mirror" ? "Aynalandı: çeyrekler birleşip yıldızı ve haçı tamamladı." : "Ötelendi: birim hücre ötelenince desen bozulmaz.";
    if (cellNow && !S.cellReached) { S.cellReached = true; text += " Elinde artık tam birim hücre var; bundan sonra öteleme de çalışır."; }
    setMsg(text, "ok");
    play(S.cellReached && cellNow ? "can" : "tik");
    renderAll();
    if (Math.abs(x0 - gx) < EPS && Math.abs(y0 - gy) < EPS && Math.abs(x1 - gx - gw) < EPS && Math.abs(y1 - gy - gh) < EPS) complete();
  }
  function setTool(tool) {
    S.tool = tool;
    root.querySelectorAll("[data-act=mirror], [data-act=translate]").forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.act === tool));
    setMsg(tool === "mirror" ? "Aynala: bir kenara dokun; birim o kenarın öbür yanına ters dönmüş olarak kopyalanır." : "Ötele: bir kenara dokun; birim olduğu gibi kaydırılarak kopyalanır.");
    renderHandles();
  }
  function complete() {
    S.completed = true;
    renderHandles();
    const seconds = Math.round((Date.now() - S.start) / 1000);
    const prev = ctx.state.progress[level.id];
    ctx.state.progress[level.id] = { completed: true, attempts: S.attempts, seconds: prev?.completed ? Math.min(prev.seconds, seconds) : seconds, difficulty: diff, ts: Date.now() };
    ctx.log(sessionRecord(true, seconds));
    ctx.saveState();
    svg.classList.add("done");
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="done-t">
      <p class="eyebrow">Keşif</p><h2 id="done-t">Duvar doldu.</h2>
      <p class="disc">${esc(level.discovery)}</p>
      ${storyCardHTML(cards[level.card])}
      <p class="stats">${S.attempts} deneme · ${mmss(seconds)}${S.wrong ? ` · ${S.wrong} kırık kopya` : ""}${S.hints ? ` · ${S.hints} ipucu` : ""}</p>
      <div class="actions">
        ${next ? `<a class="btn primary" href="#kur/${next.id}">Sonraki seviye →</a>` : `<a class="btn primary" href="#kur">Seviyeler</a>`}
        <button type="button" class="btn" data-act="replay">Tekrar oyna</button>
        <a class="btn" href="#home">Lonca</a>
      </div></div>`;
    $("[data-act=replay]", overlay).addEventListener("click", () => { overlay.hidden = true; reset(); });
    $(".btn.primary", overlay).focus();
  }
  function sessionRecord(completed, seconds) {
    return { ts: new Date().toISOString(), mode: "kur", family: level.family, level: level.id, difficulty: diff, attempts: S.attempts, wrongFamilyAttempts: 0, brokenCopies: S.wrong, seconds, completed, hintsUsed: S.hints };
  }
  function reset() {
    S.timers.forEach(clearTimeout); S.timers = [];
    Object.assign(S, { tiles: [G.IDENTITY], region: [ux, uy, ux + uw, uy + uh], history: [], bad: null, cellReached: false, pulse: false, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false });
    svg.classList.remove("done");
    setTool("mirror");
    setMsg(level.hint?.[diff] || level.hint?.ortaokul || "", "hint");
    renderAll();
  }

  // ---- olaylar ----
  handlesEl.addEventListener("click", (e) => { const g = e.target.closest("[data-edge]"); if (g) grow(g.dataset.edge); });
  handlesEl.addEventListener("keydown", (e) => {
    const g = e.target.closest("[data-edge]"); if (!g || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); grow(g.dataset.edge);
  });
  root.querySelector(".toolbar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]"); if (!btn) return;
    const act = btn.dataset.act;
    if (act === "mirror" || act === "translate") setTool(act);
    else if (act === "reset") { reset(); setMsg("Tahta temizlendi."); }
    else if (S.completed || S.bad) return;
    else if (act === "undo") {
      const h = S.history.pop(); if (!h) { setMsg("Geri alınacak kopya yok."); return; }
      S.tiles = h.tiles; S.region = h.region; renderAll(); setMsg("Son kopya geri alındı.");
    } else if (act === "hint") {
      S.hints++;
      setMsg(level.hint?.[diff] || level.hint?.ortaokul || "", "hint");
      S.pulse = true; renderHandles();
      S.timers.push(setTimeout(() => { S.pulse = false; renderHandles(); }, 3000));
    }
  });
  const ro = new ResizeObserver(updateScale);
  ro.observe(svg);

  const thumb = $(".unit-box svg", root);
  const tclip = svgEl("clipPath", { id: `${clipId}-t`, clipPathUnits: "userSpaceOnUse" });
  tclip.appendChild(svgEl("rect", { x: ux, y: uy, width: uw, height: uh }));
  const defs = svgEl("defs"); defs.appendChild(tclip);
  const t = tileEl(G.IDENTITY, "first"); t.firstChild.setAttribute("clip-path", `url(#${clipId}-t)`);
  thumb.append(defs, t);

  reset();
  updateScale();

  return () => {
    ro.disconnect();
    S.timers.forEach(clearTimeout);
    if (!S.completed && S.attempts > 0) { ctx.log(sessionRecord(false, Math.round((Date.now() - S.start) / 1000))); ctx.saveState(); }
  };
}

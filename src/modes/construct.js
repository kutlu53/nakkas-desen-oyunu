// Kalfa — Kur, hazırlık seviyesi: yıldızı pergel ve cetvelle kur. Parçalar çizimden çıkar.
// Veri: data/levels.json → points, steps, finale (tool: "construct"). Şekil matematiği: ../geometry.js (saf).
import { pieceElement, FAMILY_LABEL } from "../pieces.js";
import * as G from "../geometry.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const PICK_PX = 24;          // noktayı tutma mesafesi (piksel)
const ARC_SPAN = 0.25;       // yay: kestiği noktanın iki yanına radyan
const LINE_EXTEND = 0.2;     // doğru: üstündeki en uç noktaların ötesine uzatma (birim)
const FINALE_DELAY = 1400;   // yıldız boyandıktan sonra kart açılmadan önce (ms)
const TOOL = { pergel: "Pergel", cetvel: "Cetvel", boya: "Boya" };

const $ = (s, el = document) => el.querySelector(s);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function renderConstruct(root, ctx, level, levels, byId) {
  const diff = ctx.difficulty, coach = diff === "ortaokul";
  const pts = level.points, steps = level.steps, fin = level.finale;
  const next = levels.filter((l) => l.family === level.family && l.order > level.order).sort((a, b) => a.order - b.order)[0];
  const [vx, vy, vw, vh] = level.view;
  const S = { step: 0, drawn: [], visible: new Set(level.start), sel: null, drag: null, pulse: false, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false, pxPerUnit: 100, timers: [] };

  root.innerHTML = `
    <header class="mode-head">
      <a class="back" href="#kur">← Seviyeler</a>
      <p class="eyebrow">Kalfa · ${FAMILY_LABEL[level.family]} sistem · hazırlık · ${diff}</p>
      <h1>${esc(level.title)}</h1>
      <p class="story">${esc(level.story)}</p>
    </header>
    <section class="play construct">
      <div class="toolbar" role="toolbar" aria-label="Araçlar">
        <button type="button" data-act="hint">İpucu</button>
        <button type="button" data-act="show">Usta göstersin</button>
        <button type="button" data-act="reset">Sıfırla</button>
      </div>
      <p class="msg" aria-live="polite"><span class="fb"></span><strong class="task"></strong></p>
      <svg class="board" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Çizim tahtası">
        <g class="cons"></g><g class="fill"></g><g class="preview"></g><g class="pts"></g>
      </svg>
      <ol class="steps" aria-label="Adımlar"></ol>
    </section>
    <div class="overlay" hidden></div>`;

  const svg = $(".board", root), overlay = $(".overlay", root), stepsEl = $(".steps", root);
  const layers = Object.fromEntries(["cons", "fill", "preview", "pts"].map((k) => [k, $(`.${k}`, svg)]));
  const fbEl = $(".fb", root), taskEl = $(".task", root);

  // ---- yardımcılar ----
  const toBoard = (clientX, clientY) => { const pt = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse()); return [pt.x, pt.y]; };
  const setFb = (text, cls = "") => { fbEl.textContent = text; fbEl.className = `fb ${cls}`; };
  const current = () => steps[S.step];
  const nearest = ([bx, by]) => {
    let best = null, bd = PICK_PX / S.pxPerUnit;
    for (const k of S.visible) { const d = G.dist(pts[k], [bx, by]); if (d < bd) { bd = d; best = k; } }
    return best;
  };
  const pickHint = (st) => st.tool === "pergel" ? `Pergel: sivri uç ${st.pick[0]} noktasında, kalem ${st.pick[1]} noktasında.`
    : st.tool === "cetvel" ? `Cetvel: ${st.pick[0]} ile ${st.pick[1]} noktalarını birleştir.` : "Yıldızın içine dokun.";
  const updateScale = () => {
    const r = svg.getBoundingClientRect();
    if (r.width && r.height) S.pxPerUnit = Math.min(r.width / vw, r.height / vh);
    renderPoints();
  };

  // ---- çizim ----
  /** Doğruyu, üstündeki görünür noktaların hepsini kapsayacak kadar uzat. */
  function lineSpan(s) {
    const L = G.dist(s.a, s.b), u = [(s.b[0] - s.a[0]) / L, (s.b[1] - s.a[1]) / L];
    const ts = [...S.visible].map((k) => pts[k]).filter((p) => G.pointOnShape(p, s)).map((p) => (p[0] - s.a[0]) * u[0] + (p[1] - s.a[1]) * u[1]);
    const t0 = Math.min(0, ...ts) - LINE_EXTEND, t1 = Math.max(L, ...ts) + LINE_EXTEND;
    return [[s.a[0] + u[0] * t0, s.a[1] + u[1] * t0], [s.a[0] + u[0] * t1, s.a[1] + u[1] * t1]];
  }
  function shapeEl({ obj, reveals, step }) {
    const s = G.constructionShape(obj, pts);
    let el;
    if (obj.circle) el = svgEl("circle", { cx: s.c[0], cy: s.c[1], r: s.r });
    else if (obj.arc) {
      // yay: pergelle yalnızca kesişimin çevresi çizilir
      const on = (t) => `${s.c[0] + s.r * Math.cos(t)},${s.c[1] + s.r * Math.sin(t)}`;
      const d = reveals.filter((k) => G.pointOnShape(pts[k], s)).map((k) => {
        const a = Math.atan2(pts[k][1] - s.c[1], pts[k][0] - s.c[0]);
        return `M${on(a - ARC_SPAN)} A${s.r},${s.r} 0 0 1 ${on(a + ARC_SPAN)}`;
      }).join(" ");
      el = svgEl("path", { d });
    } else {
      const [a, b] = s.type === "segment" ? [s.a, s.b] : lineSpan(s);
      el = svgEl("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
    }
    el.setAttribute("class", `c-obj ${obj.seg ? "c-seg" : ""} ${step === S.step - 1 ? "fresh" : ""}`);
    return el;
  }
  function renderCons() { layers.cons.replaceChildren(...S.drawn.map(shapeEl)); }
  function renderPoints() {
    const st = current(), r = 5 / S.pxPerUnit, fs = 13 / S.pxPerUnit;
    const want = new Set(st && st.tool !== "boya" && (coach || S.pulse) ? st.pick : []);
    layers.pts.replaceChildren(...[...S.visible].map((k) => {
      const [x, y] = pts[k];
      const g = svgEl("g", { class: `pt ${want.has(k) ? "want" : ""} ${S.sel === k ? "sel" : ""}`, tabindex: "0", role: "button", "aria-label": `Nokta ${k}` });
      g.dataset.k = k;
      g.appendChild(svgEl("circle", { cx: x, cy: y, r }));
      // etiket merkezden dışa doğru; O için sol üst
      const len = Math.hypot(x, y), [ux, uy] = len ? [x / len, y / len] : [-0.7, -0.7];
      const t = svgEl("text", { x: x + ux * fs * 1.1, y: y + uy * fs * 1.1, "font-size": fs, "stroke-width": 3 / S.pxPerUnit, "text-anchor": "middle", "dominant-baseline": "central" });
      t.textContent = k;
      g.appendChild(t);
      return g;
    }));
  }
  function renderSteps() {
    stepsEl.innerHTML = steps.map((st, i) => `<li class="${i < S.step ? "done" : i === S.step ? "now" : ""}"${i === S.step ? ' aria-current="step"' : ""}><span class="tool">${TOOL[st.tool]}</span> ${esc(st.title)}</li>`).join("");
    const st = current();
    taskEl.textContent = st ? `Adım ${S.step + 1}/${steps.length}: ${st.say}` : "";
  }
  function renderAll() { renderCons(); renderPoints(); renderSteps(); }
  function renderPreview(from, p) {
    const st = current(), a = pts[from];
    layers.preview.replaceChildren(st.tool === "pergel"
      ? svgEl("circle", { cx: a[0], cy: a[1], r: G.dist(a, p), class: "c-preview" })
      : svgEl("line", { x1: a[0], y1: a[1], x2: p[0], y2: p[1], class: "c-preview" }));
  }

  // ---- adımlar ----
  function attempt(a, b) {
    const st = current(); if (!st) return;
    S.attempts++;
    const [p, q] = st.pick;
    const good = st.tool === "pergel"
      ? a === p && Math.abs(G.dist(pts[a], pts[b]) - G.dist(pts[p], pts[q])) < 1e-3
      : (a === p && b === q) || (a === q && b === p);
    if (!good) {
      S.wrong++;
      setFb(coach ? pickHint(st) : "Bu çizim yıldıza götürmüyor. Adımı yeniden oku.", "warn");
      renderPoints(); shake();
      return;
    }
    apply(false);
  }
  function apply(shown) {
    const st = current(); if (!st) return;
    S.sel = null;
    if (st.tool === "boya") { S.step++; finale(); return; }
    for (const obj of st.draw) S.drawn.push({ obj, reveals: st.reveals || [], step: S.step });
    for (const k of st.reveals || []) S.visible.add(k);
    S.step++;
    setFb(`${shown ? "Usta çizdi. " : "✓ "}${st.done}`, "ok");
    renderAll();
  }
  function finale() {
    const star = byId[fin.fill];
    const g = svgEl("g", { class: "piece fresh" });
    g.appendChild(pieceElement(star));
    // kılavuz parça: adlı bir noktada (at) ya da doğrudan konum ve dönmeyle
    const gh = fin.ghost, [gx, gy] = gh.at ? pts[gh.at] : [gh.x, gh.y];
    const ghost = svgEl("path", { d: G.toPath(G.placedPoints(byId[gh.pieceId], { x: gx, y: gy, rot: gh.rot || 0 })), class: "ghost" });
    const [nx, ny] = fin.notch, fs = 13 / S.pxPerUnit;
    const mark = svgEl("circle", { cx: nx, cy: ny, r: 9 / S.pxPerUnit, class: "snap-marker" });
    const label = svgEl("text", { x: nx + fs * 1.2, y: ny - fs * 0.4, "font-size": fs, class: "vlabel vlabel-tam" });
    label.textContent = fin.notchLabel || "";
    layers.fill.replaceChildren(g, ghost, mark, label);
    svg.classList.add("finale");
    setFb(fin.say, "ok");
    renderPoints(); renderSteps();
    S.timers.push(setTimeout(complete, FINALE_DELAY));
  }
  function complete() {
    S.completed = true;
    const seconds = Math.round((Date.now() - S.start) / 1000);
    const prev = ctx.state.progress[level.id];
    ctx.state.progress[level.id] = { completed: true, attempts: S.attempts, seconds: prev?.completed ? Math.min(prev.seconds, seconds) : seconds, difficulty: diff, ts: Date.now() };
    ctx.log(sessionRecord(true, seconds));
    ctx.saveState();
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="done-t">
      <p class="eyebrow">Keşif</p><h2 id="done-t">Yıldız pergelden çıktı.</h2>
      <p class="disc">${esc(level.discovery)}</p>
      <p class="stats">${S.attempts} deneme · ${mmss(seconds)}${S.wrong ? ` · ${S.wrong} yanlış çizim` : ""}${S.hints ? ` · ${S.hints} ipucu` : ""}</p>
      <div class="actions">
        ${next ? `<a class="btn primary" href="#kur/${next.id}">Sonraki seviye →</a>` : `<a class="btn primary" href="#kur">Seviyeler</a>`}
        <button type="button" class="btn" data-act="replay">Tekrar çiz</button>
        <a class="btn" href="#home">Lonca</a>
      </div></div>`;
    $("[data-act=replay]", overlay).addEventListener("click", () => { overlay.hidden = true; reset(); });
    $(".btn.primary", overlay).focus();
  }
  function sessionRecord(completed, seconds) {
    return { ts: new Date().toISOString(), mode: "kur", family: level.family, level: level.id, difficulty: diff, attempts: S.attempts, wrongFamilyAttempts: 0, wrongPicks: S.wrong, seconds, completed, hintsUsed: S.hints };
  }
  function reset() {
    S.timers.forEach(clearTimeout); S.timers = [];
    Object.assign(S, { step: 0, drawn: [], visible: new Set(level.start), sel: null, drag: null, pulse: false, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false });
    layers.fill.replaceChildren(); layers.preview.replaceChildren();
    svg.classList.remove("finale");
    setFb(level.hint?.[diff] || level.hint?.ortaokul || "");
    renderAll();
  }
  function shake() { svg.classList.remove("shake"); void svg.offsetWidth; svg.classList.add("shake"); }

  /** Dokunma ya da Enter ile nokta seçimi: ilk nokta tutulur, ikincisi çizimi dener. */
  function choose(k) {
    const st = current(); if (!st || S.completed) return;
    if (st.tool === "boya") { if (k === st.pick[0]) apply(false); else setFb(pickHint(st), "warn"); return; }
    if (S.sel && S.sel !== k) { const a = S.sel; S.sel = null; attempt(a, k); return; }
    S.sel = k;
    setFb(`${k} tutuldu. ${TOOL[st.tool]} için ikinci noktaya dokun ya da oraya sürükle.`);
    renderPoints();
  }

  // ---- olaylar ----
  svg.addEventListener("pointerdown", (e) => {
    const st = current(); if (!st || S.completed || e.button > 0) return;
    e.preventDefault();
    const p = toBoard(e.clientX, e.clientY);
    if (st.tool === "boya") {
      if (G.pointInPolygon(p, byId[fin.fill].points)) apply(false); else setFb(pickHint(st), "warn");
      return;
    }
    const k = nearest(p);
    if (!k) { setFb(level.hint?.ortaokul || "Bir noktadan başla."); return; }
    if (S.sel && S.sel !== k) { choose(k); return; }
    S.sel = k; renderPoints();
    S.drag = { from: k, id: e.pointerId };
    try { svg.setPointerCapture(e.pointerId); } catch {}
  });
  svg.addEventListener("pointermove", (e) => {
    if (!S.drag || e.pointerId !== S.drag.id) return;
    renderPreview(S.drag.from, toBoard(e.clientX, e.clientY));
  });
  svg.addEventListener("pointerup", (e) => {
    if (!S.drag || e.pointerId !== S.drag.id) return;
    const { from } = S.drag; S.drag = null;
    try { svg.releasePointerCapture(e.pointerId); } catch {}
    layers.preview.replaceChildren();
    const k = nearest(toBoard(e.clientX, e.clientY));
    if (k && k !== from) { S.sel = null; attempt(from, k); }
    else { S.sel = null; choose(from); }
  });
  svg.addEventListener("pointercancel", () => { S.drag = null; layers.preview.replaceChildren(); });
  layers.pts.addEventListener("keydown", (e) => {
    const g = e.target.closest("[data-k]"); if (!g || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); choose(g.dataset.k);
  });
  root.querySelector(".toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const st = current();
    if (b.dataset.act === "reset") { reset(); setFb("Tahta temizlendi."); return; }
    if (!st || S.completed) return;
    S.hints++;
    if (b.dataset.act === "hint") {
      setFb(pickHint(st), "hint");
      S.pulse = true; renderPoints();
      S.timers.push(setTimeout(() => { S.pulse = false; renderPoints(); }, 3000));
    } else if (b.dataset.act === "show") apply(true);
  });
  svg.addEventListener("dragstart", (e) => e.preventDefault());
  const ro = new ResizeObserver(updateScale);
  ro.observe(svg);

  reset();
  updateScale();

  return () => {
    ro.disconnect();
    S.timers.forEach(clearTimeout);
    if (!S.completed && S.attempts > 0) { ctx.log(sessionRecord(false, Math.round((Date.now() - S.start) / 1000))); ctx.saveState(); }
  };
}

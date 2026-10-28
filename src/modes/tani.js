// Çırak — Tanı: desende yıldızı bul, köşelerini say, birim hücreyi çerçevele; lisede "hangi aileyle yapılamaz?".
// Veri: data/motifs.json (yapılar, hikâyeler), data/tani.json (aile başına kesin desen çizimi; build/gen_tani.mjs üretir).
import { FAMILY_LABEL } from "../pieces.js";
import { play } from "../sound.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const FIND_TOL = 0.45;    // yıldız merkezine dokunma payı (birim; yıldız yarıçapı 1)
const SNAP_TOL = 0.7;     // birim hücre için dokunuşu en yakın yıldıza yapıştırma payı
const STEP_DEG = { 6: 60, 8: 45, 10: 36, 12: 30 };
const PIECE_FOR_NOTCH = { 6: "altıgen", 8: "artının omzu", 10: "beşgen", 12: "kare" };

const $ = (s, el = document) => el.querySelector(s);
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const dist = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);
const lowerLabel = (n) => FAMILY_LABEL[n].toLowerCase();

let cache = null;
async function loadData() {
  if (!cache) {
    const [m, t] = await Promise.all([
      fetch(new URL("../../data/motifs.json", import.meta.url)).then((r) => r.json()),
      fetch(new URL("../../data/tani.json", import.meta.url)).then((r) => r.json()),
    ]);
    cache = { motifs: m.motifs, drawings: Object.fromEntries(t.families.map((f) => [f.family, f])) };
  }
  return cache;
}

export async function mount(root, ctx) {
  const data = await loadData();
  ctx.state.atlas ||= {};
  const motif = data.motifs.find((m) => m.id === ctx.param);
  if (!motif) { renderIndex(root, ctx, data); return () => {}; }
  return renderMotif(root, ctx, motif, data);
}

// ---------------- motif listesi ----------------
function renderIndex(root, ctx, { motifs }) {
  const got = motifs.filter((m) => ctx.state.atlas[m.id]?.completed).length;
  root.innerHTML = `<a class="back" href="#home">← Lonca</a>
    <header class="mode-head"><p class="eyebrow">Çırak · ${ctx.difficulty}</p><h1>Tanı</h1>
    <p class="lead">Desende yıldızı bul, köşelerini say, tekrar eden birimi çerçevele. Her motif atlasına bir hikâye kartı ekler. Atlas: ${got}/${motifs.length}.</p></header>
    <section class="levels"></section>`;
  const list = $(".levels", root);
  for (const m of motifs) {
    const a = ctx.state.atlas[m.id];
    list.insertAdjacentHTML("beforeend", `<a class="level ${a?.completed ? "done" : ""}" href="#tani/${esc(m.id)}">
      <span class="num">${a?.completed ? m.family : "?"}</span><strong>${esc(m.title)}</strong>
      <small>${esc(m.place)} · ${esc(m.period)}${a?.completed ? ` · ${lowerLabel(m.family)} sistem` : ""}</small></a>`);
  }
}

// ---------------- motif ----------------
function renderMotif(root, ctx, motif, { motifs, drawings }) {
  const diff = ctx.difficulty, coach = diff === "ortaokul";
  const dr = drawings[motif.family];
  const wrongFam = motif.questions?.wrongFamilyLise;
  const steps = ["find", "count", "cell", ...(diff === "lise" && wrongFam ? ["family"] : [])];
  const TITLES = { find: "Yıldızı bul", count: "Köşe say", cell: "Birim hücre", family: "Hangi aile?" };
  const next = motifs[(motifs.indexOf(motif) + 1) % motifs.length];
  const S = { step: 0, star: null, marks: [], cell: [], attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false, pxPerUnit: 60 };
  const [vx, vy, vw, vh] = dr.view;

  root.innerHTML = `
    <header class="mode-head">
      <a class="back" href="#tani">← Motifler</a>
      <p class="eyebrow">Çırak · ${esc(motif.place)} · ${diff}</p>
      <h1>${esc(motif.title)}</h1>
      <p class="story">${esc(motif.period)}</p>
    </header>
    <section class="play tani">
      <div class="toolbar" role="toolbar" aria-label="Araçlar">
        <button type="button" data-act="hint">İpucu</button>
        <button type="button" data-act="reset">Baştan</button>
      </div>
      <p class="msg" aria-live="polite"><span class="fb"></span><strong class="task"></strong></p>
      <svg class="board" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice" role="application" tabindex="0" aria-label="Desen çizimi. Klavye: ok tuşları nişangâhı taşır (Shift: büyük adım), Enter dokunur.">
        <g class="art"></g><g class="glow"></g><g class="marks"></g><g class="cursor"></g>
      </svg>
      <aside class="tray side">
        <ol class="steps" aria-label="Sorular"></ol>
        <div class="choices" hidden></div>
        <p class="note">Çizim, bu yapıda görülen desen ailesinden kesin bir örnektir; yapının kendi deseninin birebir kopyası değildir.</p>
      </aside>
    </section>
    <div class="overlay" hidden></div>`;
  const svg = $(".board", root), art = $(".art", svg), glow = $(".glow", svg), marks = $(".marks", svg), cursorEl = $(".cursor", svg);
  const fbEl = $(".fb", root), taskEl = $(".task", root), stepsEl = $(".steps", root), choicesEl = $(".choices", root), overlay = $(".overlay", root);
  for (const f of dr.faces) art.appendChild(svgEl("path", { d: f.d, fill: f.fill }));

  const setFb = (text, cls = "") => { fbEl.textContent = text; fbEl.className = `fb ${cls}`; };
  const toBoard = (e) => { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; };
  const nearestStar = (p, tol) => { let best = null, bd = tol; for (const s of dr.stars) { const d = dist(s, p); if (d < bd) { bd = d; best = s; } } return best; };
  const cur = () => steps[S.step];
  const updateScale = () => { const r = svg.getBoundingClientRect(); if (r.width) S.pxPerUnit = Math.max(r.width / vw, r.height / vh); renderMarks(); };

  const TASK = {
    find: () => `Desendeki ${motif.family === 12 ? "en büyük " : ""}yıldızlardan birinin tam ortasına dokun.`,
    count: () => `Bulduğun yıldızın kaç köşesi (ucu) var?${coach ? " Uçlarına dokunarak işaretleyebilirsin." : ""}`,
    cell: () => "Tekrar eden birimi çerçevele: bir yıldıza, sonra ona en yakın iki komşu yıldıza dokun.",
    family: () => "Bu desen hangi ailenin parçalarıyla yapılamaz?",
  };
  const HINT = {
    find: "Yıldızlar desenin en büyük, sivri uçlu parçalarıdır. Ortasına dokun; kenarına değil.",
    count: "Bir uçtan başla, saat yönünde say. Saydığın ucu işaretlersen karışmaz.",
    cell: "İki komşu yıldız arasındaki yol öteleme vektörüdür. İki farklı yönde komşu seç; üçü aynı doğruda olmasın.",
    family: `Yıldızın çentiği ${dr.notch}°. Bir ailenin parçalarının açıları o ailenin adım açısının (6'lı 60°, 8'li 45°, 10'lu 36°, 12'li 30°) katlarıdır.`,
  };

  function renderSteps() {
    stepsEl.innerHTML = steps.map((s, i) => `<li class="${i < S.step ? "done" : i === S.step ? "now" : ""}"${i === S.step ? ' aria-current="step"' : ""}>${TITLES[s]}</li>`).join("");
    taskEl.textContent = cur() ? `Soru ${S.step + 1}/${steps.length}: ${TASK[cur()]()}` : "";
    choicesEl.hidden = !(cur() === "count" || cur() === "family");
    if (cur() === "count") choicesEl.innerHTML = [6, 8, 10, 12].map((n) => `<button type="button" class="btn" data-n="${n}">${n}</button>`).join("") + (coach ? `<span class="counter">İşaret: ${S.marks.length}</span>` : "");
    if (cur() === "family") choicesEl.innerHTML = [motif.family, wrongFam].sort((a, b) => a - b).map((n) => `<button type="button" class="btn" data-fam="${n}">${FAMILY_LABEL[n]} parçalar</button>`).join("");
  }
  function renderMarks() {
    const r = 7 / S.pxPerUnit;
    glow.replaceChildren(...(coach && cur() === "find" ? dr.stars.map(([x, y]) => svgEl("circle", { cx: x, cy: y, r: 0.85, class: "star-glow" })) : []));
    const els = [];
    if (S.star) els.push(svgEl("circle", { cx: S.star[0], cy: S.star[1], r: 1.08, class: "found" }));
    for (const [x, y] of S.marks) els.push(svgEl("circle", { cx: x, cy: y, r, class: "tipmark" }));
    if (S.cell.length) {
      const pts = S.cell.length === 3 ? [S.cell[0], S.cell[1], [S.cell[1][0] + S.cell[2][0] - S.cell[0][0], S.cell[1][1] + S.cell[2][1] - S.cell[0][1]], S.cell[2]] : S.cell;
      els.push(svgEl(S.cell.length === 3 ? "polygon" : "polyline", { points: pts.map((p) => p.join(",")).join(" "), class: `cellframe ${S.cellOk ? "ok" : ""}` }));
      for (const [x, y] of S.cell) els.push(svgEl("circle", { cx: x, cy: y, r: r * 1.3, class: "cellpt" }));
    }
    marks.replaceChildren(...els);
  }
  const advance = (text) => { S.step++; setFb(text, "ok"); play("can"); renderSteps(); renderMarks(); if (S.step >= steps.length) complete(); };

  function onTap(p) {
    const st = cur(); if (!st || S.completed) return;
    if (st === "find") {
      S.attempts++;
      const s = nearestStar(p, FIND_TOL);
      if (s) { S.star = s; advance(`Buldun. Yıldızın ortası burası.`); }
      else { setFb("Burası bir yıldızın ortası değil. Sivri uçlu büyük parçanın ortasına dokun.", "warn"); play("tok"); }
    } else if (st === "count" && coach && S.star && dist(p, S.star) < 1.4) {
      const i = S.marks.findIndex((m) => dist(m, p) < 0.18);
      if (i >= 0) S.marks.splice(i, 1); else S.marks.push(p);
      renderSteps(); renderMarks();
    } else if (st === "cell") {
      const s = nearestStar(p, SNAP_TOL); if (!s) { setFb("Bir yıldızın ortasına yakın dokun; çerçeve yıldızdan yıldıza kurulur.", "warn"); return; }
      if (S.cell.some((c) => dist(c, s) < 1e-6)) return;
      S.cell.push(s); renderMarks();
      if (S.cell.length === 3) checkCell();
      else setFb(S.cell.length === 1 ? "Köşe seçildi. Şimdi en yakın komşu yıldıza dokun." : "Bir komşu daha: başka bir yönde.");
    }
  }
  function checkCell() {
    S.attempts++;
    const [o, p, q] = S.cell, u = [p[0] - o[0], p[1] - o[1]], v = [q[0] - o[0], q[1] - o[1]];
    const det = Math.abs(u[0] * v[1] - u[1] * v[0]);
    if (det < 1e-3) { S.wrong++; return retryCell("Üç yıldız aynı doğru üstünde; bu bir çerçeve kurmaz. İki farklı yön seç."); }
    const k = det / dr.cellArea;
    if (Math.abs(k - 1) < 0.02) {
      S.cellOk = true;
      return advance("Bu çerçeve bir birim hücre: ötelenince bütün deseni verir. Köşelerindeki yıldız parçaları toplanınca tam bir yıldız eder.");
    }
    S.wrong++;
    retryCell(`Bu çerçeve ${Math.round(k)} birim hücre büyüklüğünde. Daha yakın komşular seç.`);
  }
  function retryCell(text) { setFb(text, "warn"); play("tok"); S.timer = setTimeout(() => { S.cell = []; renderMarks(); }, 1400); renderMarks(); }

  choicesEl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || S.completed) return;
    S.attempts++;
    if (b.dataset.n) {
      const n = +b.dataset.n;
      if (n === motif.family) advance(`Doğru: ${n} köşe — ${lowerLabel(n)} sistem. Uç açısı ${dr.tipAngle}°, çentiği ${dr.notch}°; çentiğe ${PIECE_FOR_NOTCH[n]} oturur.`);
      else { S.wrong++; play("tok"); setFb(`${n} değil. Bir uçtan başlayıp yeniden say${coach ? "; uçlara dokunarak işaretle" : ""}.`, "warn"); }
    } else if (b.dataset.fam) {
      const n = +b.dataset.fam;
      if (n === wrongFam) advance(`Doğru. Çentik ${dr.notch}°; ${lowerLabel(n)} parçaların açıları ${STEP_DEG[n]}°'nin katıdır ve ${dr.notch} bunlardan biri değil. Köşede 360 tamamlanmaz.`);
      else { S.wrong++; play("tok"); setFb(`Bu desenin kendi ailesi o: çentiğine (${dr.notch}°) ${PIECE_FOR_NOTCH[n]} tam oturur. Öbürünü dene.`, "warn"); }
    }
  });
  svg.addEventListener("pointerdown", (e) => { if (e.button > 0) return; e.preventDefault(); S.kb = false; renderCursor(); onTap(toBoard(e)); });
  // klavye: ok tuşları bir nişangâhı taşır, Enter/boşluk o noktaya dokunur (yıldızların yeri ipucu olarak verilmez)
  const CUR_STEP = 0.25;
  S.cursor = [vx + vw / 2, vy + vh / 2];
  function renderCursor() {
    if (!S.kb) { cursorEl.replaceChildren(); return; }
    const [x, y] = S.cursor, r = 10 / S.pxPerUnit;
    cursorEl.replaceChildren(svgEl("circle", { cx: x, cy: y, r, class: "crosshair" }), svgEl("line", { x1: x - 2 * r, y1: y, x2: x + 2 * r, y2: y, class: "crosshair" }), svgEl("line", { x1: x, y1: y - 2 * r, x2: x, y2: y + 2 * r, class: "crosshair" }));
  }
  svg.addEventListener("keydown", (e) => {
    const d = (e.shiftKey ? 4 : 1) * CUR_STEP, mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (mv) { e.preventDefault(); S.kb = true; S.cursor = [Math.min(vx + vw, Math.max(vx, S.cursor[0] + mv[0])), Math.min(vy + vh, Math.max(vy, S.cursor[1] + mv[1]))]; renderCursor(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); S.kb = true; renderCursor(); onTap(S.cursor); }
  });
  svg.addEventListener("focus", () => { S.kb = true; renderCursor(); });
  svg.addEventListener("blur", () => { S.kb = false; renderCursor(); });
  root.querySelector(".toolbar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "reset") { reset(); setFb("Baştan başladın."); return; }
    if (!cur()) return;
    S.hints++; setFb(HINT[cur()], "hint");
  });

  function complete() {
    S.completed = true;
    const seconds = Math.round((Date.now() - S.start) / 1000);
    const prev = ctx.state.atlas[motif.id];
    ctx.state.atlas[motif.id] = { completed: true, attempts: S.attempts, seconds: prev?.completed ? Math.min(prev.seconds, seconds) : seconds, difficulty: diff, ts: Date.now() };
    ctx.log(record(true, seconds)); ctx.saveState();
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="done-t">
      <p class="eyebrow">Atlasına eklendi · ${lowerLabel(motif.family)} sistem</p><h2 id="done-t">${esc(motif.title)}</h2>
      <p class="disc">${esc(motif.story)}</p>
      ${motif.funFact ? `<p class="disc fun">${esc(motif.funFact)}</p>` : ""}
      <p class="stats">${S.attempts} deneme · ${mmss(seconds)}${S.wrong ? ` · ${S.wrong} yanlış` : ""}${S.hints ? ` · ${S.hints} ipucu` : ""}</p>
      <div class="actions">
        <a class="btn primary" href="#tani/${esc(next.id)}">Sonraki motif →</a>
        <a class="btn" href="#tani">Motifler</a>
        <a class="btn" href="#kur">Kur'a geç</a>
      </div></div>`;
    $(".btn.primary", overlay).focus();
  }
  const record = (completed, seconds) => ({ ts: new Date().toISOString(), mode: "tani", family: motif.family, level: motif.id, difficulty: diff, attempts: S.attempts, wrongFamilyAttempts: S.wrong, seconds, completed, hintsUsed: S.hints });
  function reset() {
    clearTimeout(S.timer);
    Object.assign(S, { step: 0, star: null, marks: [], cell: [], cellOk: false, attempts: 0, wrong: 0, hints: 0, start: Date.now(), completed: false });
    overlay.hidden = true; setFb(""); renderSteps(); renderMarks();
  }
  const ro = new ResizeObserver(updateScale); ro.observe(svg);
  reset(); updateScale();
  return () => {
    ro.disconnect(); clearTimeout(S.timer);
    if (!S.completed && S.attempts > 0) { ctx.log(record(false, Math.round((Date.now() - S.start) / 1000))); ctx.saveState(); }
  };
}

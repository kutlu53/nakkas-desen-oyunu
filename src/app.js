// Giriş: rütbe/mod seçimi, Parça Atlası, yönlendirme, localStorage. Modlar src/modes/ altında; tembel yüklenir.
import { loadPieces, pieceThumb, FAMILY_LABEL, FAMILY_TITLE } from "./pieces.js";
import { rankStatus, RANKS, RANK_LABEL } from "./rank.js";
import { setSound, play } from "./sound.js";

const $ = (s, el = document) => el.querySelector(s);
const MAX_LOG = 500;

const state = loadState();
setSound(state.sound);
let homeData = null; // giriş ekranının seviye/motif verisi; render() modül başında çağrıldığından burada tanımlı olmalı

function loadState() {
  const base = { difficulty: "ortaokul", progress: {}, atlas: {}, badges: {}, log: [], gallery: [], rank: null, sound: false };
  try { return Object.assign(base, JSON.parse(localStorage.getItem("nakkas") || "{}")); }
  catch { return base; }
}
function saveState() { try { localStorage.setItem("nakkas", JSON.stringify(state)); } catch {} }
/** Araştırma logu: oturum başına bir kayıt. Ayarlar → Verileri dışa aktar ile JSON verilir. */
function log(record) { state.log.push(record); if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG); }

// ---------- yönlendirme ----------
const mode = (file) => async (main, ctx) => (await import(file)).mount(main, ctx);
const routes = {
  home: renderHome,
  atlas: renderAtlas,
  kur: mode("./modes/kur.js"),
  tani: mode("./modes/tani.js"),
  yarat: mode("./modes/yarat.js"),
};
let cleanup = null;
function go(route) { location.hash = route; }
window.addEventListener("hashchange", render);
render();

async function render() {
  const [route, param] = (location.hash.replace("#", "") || "home").split("/");
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const main = $("#app");
  main.innerHTML = "";
  window.scrollTo(0, 0);
  const ctx = { state, saveState, log, go, param, difficulty: state.difficulty };
  const r = await (routes[route] || renderHome)(main, ctx);
  if (typeof r === "function") cleanup = r;
}

// ---------- ekranlar ----------
async function loadHomeData() {
  if (!homeData) {
    const at = (f) => fetch(new URL(`../data/${f}`, import.meta.url)).then((r) => r.json());
    const [l, m] = await Promise.all([at("levels.json"), at("motifs.json")]);
    homeData = { levels: l.levels, motifs: m.motifs };
  }
  return homeData;
}

async function renderHome(main) {
  const { levels, motifs } = await loadHomeData();
  const done = Object.values(state.progress).filter((p) => p.completed).length;
  const atlasDone = Object.values(state.atlas || {}).filter((p) => p.completed).length;
  const rs = rankStatus(state, levels, motifs);
  const promoted = RANKS.indexOf(rs.rank) > RANKS.indexOf(state.rank || "cirak");
  if (promoted) { log({ ts: new Date().toISOString(), mode: "rutbe", rank: rs.rank, from: state.rank || "cirak" }); state.rank = rs.rank; saveState(); }
  state.rank ||= rs.rank;
  const reqs = rs.next ? `<p class="rk-next">${RANK_LABEL[rs.next.rank]} olmak için:</p><ul class="reqs">${rs.next.reqs.map((r) => `<li class="${r.ok ? "ok" : ""}">${r.ok ? "✓" : "○"} ${r.text}</li>`).join("")}</ul>`
    : `<p class="rk-next">Loncanın bütün rütbelerini aldın. Yarat'ta kendi desenlerini üret.</p>`;
  main.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Nakkaş loncası</p>
      <h1>Desen pergelle çizilir; köşede açılar 360 eder.</h1>
      <p class="lead">Önce motifleri tanı, sonra kur, sonra kendi motifini yarat.</p>
      <div class="diff">
        <span>Seviye</span>
        <button data-d="ortaokul" class="${state.difficulty === "ortaokul" ? "on" : ""}">Ortaokul</button>
        <button data-d="lise" class="${state.difficulty === "lise" ? "on" : ""}">Lise</button>
        <small>${state.difficulty === "ortaokul" ? "ipuçları açık, açı etiketleri sürekli görünür" : "etiketler isteğe bağlı, kutuda yanıltıcı parçalar"}</small>
        <button data-act="sound" aria-pressed="${!!state.sound}" class="${state.sound ? "on" : ""}">Ses: ${state.sound ? "açık" : "kapalı"}</button>
      </div>
    </section>
    <section class="rank-box" aria-label="Rütbe">
      <div class="rk-now"><span class="eyebrow">Rütben</span><strong>${RANK_LABEL[rs.rank]}</strong></div>
      <div>${reqs}</div>
    </section>
    <section class="ranks">
      <button class="rank" data-go="tani"><span class="rk">Çırak</span><strong>Tanı</strong><small>Desenlerde yıldızı bul, köşelerini say, birimi çerçevele.</small>${atlasDone ? `<em>${atlasDone} motif atlasta</em>` : ""}</button>
      <button class="rank" data-go="kur"><span class="rk">Kalfa</span><strong>Kur</strong><small>Parçaları yerleştir, açıları 360'a tamamla.</small>${done ? `<em>${done} seviye tamam</em>` : ""}</button>
      <button class="rank" data-go="yarat"><span class="rk">Usta</span><strong>Yarat</strong><small>Simetri aynasıyla kendi motifini üret.</small></button>
    </section>
    <p class="foot"><a href="#atlas">Parça atlası</a> · 29 parça, 4 aile · <button class="linkish" data-act="export">Verileri dışa aktar</button>${state.log.length ? ` (${state.log.length} oturum)` : ""}</p>
    <div class="overlay" ${promoted ? "" : "hidden"}><div class="card" role="dialog" aria-modal="true" aria-labelledby="rk-t">
      <p class="eyebrow">Lonca</p><h2 id="rk-t">${RANK_LABEL[rs.rank]} oldun.</h2>
      <p class="disc">${rs.rank === "kalfa" ? "Motifleri tanıdın ve dört ailenin ilk adımlarını kurdun. Kalfa artık çentiği açıyla okur." : "Dört ailenin birim hücresini kurdun ve ailelerin karıştığı sınavı geçtin. Usta, deseni kural ezberleyerek değil, açıyı okuyarak kurar."}</p>
      <div class="actions"><button type="button" class="btn primary" data-act="close">Devam</button></div></div></div>`;
  main.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { state.difficulty = b.dataset.d; saveState(); render(); }));
  main.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  $("[data-act=export]", main).addEventListener("click", exportData);
  $("[data-act=sound]", main).addEventListener("click", () => { state.sound = !state.sound; setSound(state.sound); saveState(); play("tik"); render(); });
  const ov = $(".overlay", main);
  $("[data-act=close]", main).addEventListener("click", () => { ov.hidden = true; });
  if (promoted) { play("can"); $("[data-act=close]", main).focus(); }
}

/** Araştırma verisi + ilerleme, JSON dosyası olarak iner. Sunucu yok; dosya cihazda kalır. */
function exportData() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), difficulty: state.difficulty, progress: state.progress, log: state.log }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nakkas-veri-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function renderAtlas(main) {
  const { list } = await loadPieces();
  main.innerHTML = `<a class="back" href="#home">← Lonca</a><h1>Parça atlası</h1>
    <p class="lead">Her parçanın altında iç açıları yazar. Yıldızların çentiği (360 − iç açı) o ailenin kilit parçasını tam alır.</p>`;
  for (const fam of [8, 10, 6, 12]) {
    const sec = document.createElement("section");
    sec.className = "family";
    sec.innerHTML = `<h2>${FAMILY_LABEL[fam]} sistem <small>${FAMILY_TITLE[fam]} · adım ${360 / fam}°</small></h2><div class="grid"></div>`;
    const grid = $(".grid", sec);
    for (const p of list.filter((p) => p.family === fam)) {
      const card = document.createElement("figure");
      card.className = "card";
      card.appendChild(pieceThumb(p, 96));
      const uniq = [...new Set(p.angles)].map((a) => `${a}°`).join(" · ");
      card.insertAdjacentHTML("beforeend", `<figcaption><strong>${p.name}</strong><span>${uniq}</span>${p.role === "merkez" ? `<em>çentik ${Math.round(360 - Math.max(...p.angles))}°</em>` : ""}</figcaption>`);
      grid.appendChild(card);
    }
    main.appendChild(sec);
  }
}

// ---------- PWA ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

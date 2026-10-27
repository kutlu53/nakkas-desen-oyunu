// Giriş: rütbe/mod seçimi, Parça Atlası, yönlendirme, localStorage. Modlar src/modes/ altında; tembel yüklenir.
import { loadPieces, pieceThumb, FAMILY_LABEL, FAMILY_TITLE } from "./pieces.js";

const $ = (s, el = document) => el.querySelector(s);
const MAX_LOG = 500;

const state = loadState();

function loadState() {
  const base = { difficulty: "ortaokul", progress: {}, log: [], gallery: [] };
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
  tani: () => renderStub("Çırak — Tanı", "src/modes/tani.js"),
  yarat: () => renderStub("Usta — Yarat", "src/modes/yarat.js"),
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
function renderHome(main) {
  const done = Object.values(state.progress).filter((p) => p.completed).length;
  main.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Nakkaş loncası</p>
      <h1>Desen bir kuralla başlar: köşede açılar 360 eder.</h1>
      <p class="lead">Önce motifleri tanı, sonra kur, sonra kendi motifini yarat.</p>
      <div class="diff">
        <span>Seviye</span>
        <button data-d="ortaokul" class="${state.difficulty === "ortaokul" ? "on" : ""}">Ortaokul</button>
        <button data-d="lise" class="${state.difficulty === "lise" ? "on" : ""}">Lise</button>
        <small>${state.difficulty === "ortaokul" ? "ipuçları açık, açı etiketleri sürekli görünür" : "etiketler isteğe bağlı, kutuda yanıltıcı parçalar"}</small>
      </div>
    </section>
    <section class="ranks">
      <button class="rank" data-go="tani"><span class="rk">Çırak</span><strong>Tanı</strong><small>Yapılardaki yıldızları bul, köşelerini say.</small></button>
      <button class="rank" data-go="kur"><span class="rk">Kalfa</span><strong>Kur</strong><small>Parçaları yerleştir, açıları 360'a tamamla.</small>${done ? `<em>${done} seviye tamam</em>` : ""}</button>
      <button class="rank" data-go="yarat"><span class="rk">Usta</span><strong>Yarat</strong><small>Simetri aynasıyla kendi motifini üret.</small></button>
    </section>
    <p class="foot"><a href="#atlas">Parça atlası</a> · 27 parça, 4 aile · <button class="linkish" data-act="export">Verileri dışa aktar</button>${state.log.length ? ` (${state.log.length} oturum)` : ""}</p>`;
  main.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { state.difficulty = b.dataset.d; saveState(); render(); }));
  main.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  $("[data-act=export]", main).addEventListener("click", exportData);
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

function renderStub(title, file) {
  const main = $("#app");
  main.innerHTML = `<a class="back" href="#home">← Lonca</a><h1>${title}</h1>
    <p class="lead">Bu mod henüz yazılmadı. Sıradaki iş: <code>${file}</code>. Tasarım: <code>docs/tasarim.md</code>. Şimdilik <a href="#kur">Kalfa — Kur</a> oynanabilir.</p>`;
}

// ---------- PWA ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

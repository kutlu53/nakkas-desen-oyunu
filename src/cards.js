// Hikâye kartları: data/motifs.json → cards. Seviye verisindeki "card" alanı, tamamlama kartında gösterilir.
let cache = null;

/** Kartları bir kez yükle; id → kart. Yüklenemezse boş (oyun kartsız da çalışır). */
export async function loadCards() {
  if (cache) return cache;
  try {
    const json = await (await fetch(new URL("../data/motifs.json", import.meta.url))).json();
    cache = Object.fromEntries((json.cards || []).map((c) => [c.id, c]));
  } catch { cache = {}; }
  return cache;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Tamamlama kartının içine giren hikâye bölümü. */
export function storyCardHTML(card) {
  if (!card) return "";
  return `<section class="story-card" aria-labelledby="sc-${esc(card.id)}">
    <p class="eyebrow">Ustalar nasıl yapardı?</p>
    <h3 id="sc-${esc(card.id)}">${esc(card.title)}</h3>
    <p>${esc(card.body)}</p>
    ${card.link ? `<p class="sc-link">${esc(card.link)}</p>` : ""}
    ${card.sources?.length ? `<p class="sc-src">Kaynak: ${card.sources.map(esc).join(" · ")}</p>` : ""}
  </section>`;
}

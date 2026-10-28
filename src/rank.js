// Rütbe: çırak → kalfa → usta (docs/tasarim.md §4). Saf işlev: durumdan rütbeyi ve sonraki rütbenin koşullarını hesaplar.
import { FAMILY_LABEL } from "./pieces.js";

export const RANKS = ["cirak", "kalfa", "usta"];
export const RANK_LABEL = { cirak: "Çırak", kalfa: "Kalfa", usta: "Usta" };
const FAMILIES = [6, 8, 10, 12];

/**
 * Kalfa: atlasın yarısı (motiflerin en az yarısı tanındı) + her ailede 2. seviye.
 * Usta: kalfa + her ailede 3. seviye + rütbe sınavı (karışık kutu seviyeleri).
 * Dönüş: { rank, next: { rank, reqs: [{ id, text, ok }] } | null }
 */
export function rankStatus(state, levels, motifs) {
  const done = (id) => !!state.progress?.[id]?.completed;
  const atlasDone = motifs.filter((m) => state.atlas?.[m.id]?.completed).length, atlasNeed = Math.ceil(motifs.length / 2);
  const levelReq = (order) => FAMILIES.map((f) => {
    const l = levels.find((x) => x.family === f && x.order === order);
    return { id: `f${f}-${order}`, text: `${FAMILY_LABEL[f]} sistemde ${order}. seviye${l ? ` (${l.title})` : ""}`, ok: !!l && done(l.id) };
  });
  const exams = levels.filter((l) => Array.isArray(l.families));
  const kalfaReqs = [{ id: "atlas", text: `Atlasın yarısı: ${Math.min(atlasDone, atlasNeed)}/${atlasNeed} motif`, ok: atlasDone >= atlasNeed }, ...levelReq(2)];
  const ustaReqs = [...levelReq(3), ...exams.map((l) => ({ id: l.id, text: `Rütbe sınavı: ${l.title}`, ok: done(l.id) }))];
  const kalfa = kalfaReqs.every((r) => r.ok), usta = kalfa && ustaReqs.every((r) => r.ok);
  return { rank: usta ? "usta" : kalfa ? "kalfa" : "cirak", next: usta ? null : kalfa ? { rank: "usta", reqs: ustaReqs } : { rank: "kalfa", reqs: kalfaReqs } };
}

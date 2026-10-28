// rank.js için örnekler (node tests/run-node.mjs ile çalışır).
export function run(rankStatus, levels, motifs, ok) {
  const st = (progressIds = [], atlasIds = []) => ({ progress: Object.fromEntries(progressIds.map((id) => [id, { completed: true }])), atlas: Object.fromEntries(atlasIds.map((id) => [id, { completed: true }])) });
  const lv = (f, o) => levels.find((l) => l.family === f && l.order === o).id;
  const half = motifs.slice(0, Math.ceil(motifs.length / 2)).map((m) => m.id);
  const l2 = [6, 8, 10, 12].map((f) => lv(f, 2)), l3 = [6, 8, 10, 12].map((f) => lv(f, 3));
  const exams = levels.filter((l) => Array.isArray(l.families)).map((l) => l.id);
  let r = rankStatus(st(), levels, motifs);
  ok("rütbe: başlangıç çırak, kalfa için 5 koşul (atlas + 4 aile)", r.rank === "cirak" && r.next.rank === "kalfa" && r.next.reqs.length === 5 && r.next.reqs.every((q) => !q.ok));
  r = rankStatus(st(l2, half.slice(1)), levels, motifs);
  ok("rütbe: atlas yarıdan bir eksikse hâlâ çırak", r.rank === "cirak" && r.next.reqs.filter((q) => !q.ok).length === 1);
  r = rankStatus(st(l2, half), levels, motifs);
  ok("rütbe: atlas yarısı + her ailede 2. seviye → kalfa", r.rank === "kalfa" && r.next.rank === "usta");
  r = rankStatus(st([...l2, ...l3], half), levels, motifs);
  ok("rütbe: sınav olmadan usta olunmaz", r.rank === "kalfa" && r.next.reqs.some((q) => exams.includes(q.id) && !q.ok));
  r = rankStatus(st([...l2, ...l3, ...exams], half), levels, motifs);
  ok("rütbe: 3. seviyeler + sınav → usta, sonraki yok", r.rank === "usta" && r.next === null);
  r = rankStatus(st([...l3, ...exams], motifs.map((m) => m.id)), levels, motifs);
  ok("rütbe: kalfa koşulu (2. seviyeler) eksikse usta olunmaz", r.rank === "cirak");
}

// Aynı testleri Node ile çalıştır: node tests/run-node.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as G from "../src/geometry.js";
import { run } from "./geometry.tests.js";
const read = (f) => JSON.parse(readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8"));
const { pieces } = read("../data/pieces.json"), { levels } = read("../data/levels.json");
let fail = 0, n = 0;
const report = (name, cond) => { n++; console.log((cond ? "ok   " : "FAIL ") + name); if (!cond) fail++; };
run(G, pieces, levels, report);
const { motifs } = read("../data/motifs.json");
const { rankStatus } = await import("../src/rank.js");
(await import("./rank.tests.js")).run(rankStatus, levels, motifs, report);
console.log(fail ? `\n${fail}/${n} test başarısız` : `\n${n} test, hepsi geçti`);
process.exit(fail ? 1 : 0);

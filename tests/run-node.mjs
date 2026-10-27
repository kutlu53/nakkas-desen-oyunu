// Aynı testleri Node ile çalıştır: node tests/run-node.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as G from "../src/geometry.js";
import { run } from "./geometry.tests.js";
const { pieces } = JSON.parse(readFileSync(fileURLToPath(new URL("../data/pieces.json", import.meta.url)), "utf8"));
let fail = 0, n = 0;
run(G, pieces, (name, cond) => { n++; console.log((cond ? "ok   " : "FAIL ") + name); if (!cond) fail++; });
console.log(fail ? `\n${fail}/${n} test başarısız` : `\n${n} test, hepsi geçti`);
process.exit(fail ? 1 : 0);

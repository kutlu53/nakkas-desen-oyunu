import { toPath } from "./geometry.js";

let cache = null;

/** data/pieces.json'ı bir kez yükle. */
export async function loadPieces() {
  if (cache) return cache;
  const res = await fetch(new URL("../data/pieces.json", import.meta.url));
  const json = await res.json();
  cache = { byId: Object.fromEntries(json.pieces.map((p) => [p.id, p])), list: json.pieces };
  return cache;
}

export const FAMILY_LABEL = { 6: "Altılı", 8: "Sekizli", 10: "Onlu", 12: "On ikili" };
export const FAMILY_TITLE = { 6: "Hamam örgüsü", 8: "Medrese kapısı", 10: "Türbe kuşağı", 12: "Kubbe eteği" };

/** Bir parça için <g> elemanı üret (yerel koordinatlarda, merkez 0,0). */
export function pieceElement(piece, { stroke = "var(--ink)", strokeWidth = 0.03 } = {}) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.dataset.pieceId = piece.id;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", toPath(piece.points));
  path.setAttribute("fill", piece.color);
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", strokeWidth);
  path.setAttribute("stroke-linejoin", "round");
  g.appendChild(path);
  return g;
}

/** Tek parçayı kendi başına gösteren küçük SVG (parça kutusu, galeri). */
export function pieceThumb(piece, size = 72) {
  const xs = piece.points.map((p) => p[0]), ys = piece.points.map((p) => p[1]);
  const pad = 0.12, minx = Math.min(...xs) - pad, miny = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minx + pad, h = Math.max(...ys) - miny + pad;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `${minx} ${miny} ${w} ${h}`);
  svg.setAttribute("width", size); svg.setAttribute("height", size);
  svg.setAttribute("role", "img"); svg.setAttribute("aria-label", piece.name);
  svg.appendChild(pieceElement(piece));
  return svg;
}

// Renders the brand lockup as a tightly-cropped transparent PNG:
// wordmark "Под ръка" (Playfair Display 600) on the LEFT, the four-stone
// PaveMark on the RIGHT. Text is converted to vector paths via opentype.js,
// so no system font is needed; sharp rasterizes the SVG.
//
//   node scripts/make-logo-lockup.mjs            → marketing/logo-lockup.png
import { readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";
import sharp from "sharp";

const FONT = "node_modules/@fontsource/playfair-display/files/playfair-display-cyrillic-600-normal.woff";
const OUT = "marketing/logo-lockup.png";
const HEIGHT_PX = 512; // output raster height

const ESPRESSO = "#221c16"; // site foreground — "Под"
const OCHRE = "#c98a12"; // cobble-600 — "ръка"
const STONES = [
  // navbar PaveMark geometry (32-unit box): left/bottom/right seated + top stone
  { x: 3.9, y: 11.3, cx: 8.6, cy: 16, fill: "#a37010" },
  { x: 11.3, y: 18.7, cx: 16, cy: 23.4, fill: "#e0a019" },
  { x: 18.7, y: 11.3, cx: 23.4, cy: 16, fill: "#e8bc5c" },
  { x: 11.3, y: 3.9, cx: 16, cy: 8.6, fill: "#e4ab35" },
];

const buf = readFileSync(FONT);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const F = 240; // working font size (vector precision; output is resized)
const BASELINE = 400;
const scale = F / font.unitsPerEm;

// Serialize path commands ourselves: opentype.js's toPathData() emits NaN
// coordinates for some glyphs in multi-glyph sequences (its optimizer bug);
// the command objects themselves are clean.
function toD(p, dp = 3) {
  const n = (v) => String(Number(v.toFixed(dp)));
  let s = "";
  for (const c of p.commands) {
    if (c.type === "M") s += `M${n(c.x)} ${n(c.y)}`;
    else if (c.type === "L") s += `L${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Q") s += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "C") s += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Z") s += "Z";
  }
  return s;
}

// Compose text glyph-by-glyph (with kern pairs). The string-level
// font.getPath() mangles this subset font's GSUB and drops glyphs.
function textPath(str, x0) {
  let x = x0;
  let prev = null;
  const d = [];
  const bb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale;
    const p = g.getPath(x, BASELINE, F);
    if (p.commands.length > 0) {
      d.push(toD(p));
      const b = p.getBoundingBox();
      bb.x1 = Math.min(bb.x1, b.x1);
      bb.y1 = Math.min(bb.y1, b.y1);
      bb.x2 = Math.max(bb.x2, b.x2);
      bb.y2 = Math.max(bb.y2, b.y2);
    }
    x += g.advanceWidth * scale;
    prev = g;
  }
  return { d: d.join(" "), end: x, bb };
}

const pod = textPath("Под ", 0);
const raka = textPath("ръка", pod.end);
const ink = {
  x1: pod.bb.x1,
  x2: raka.bb.x2,
  y1: Math.min(pod.bb.y1, raka.bb.y1),
  y2: Math.max(pod.bb.y2, raka.bb.y2),
};
const b1 = pod.bb;

// Mark: matches the navbar's optical ratio (mark ≈ 1.4em beside the text),
// vertically centered between cap-top and baseline.
const S = 1.4 * F;
const gap = 0.42 * F;
const markX = ink.x2 + gap;
const markCY = (b1.y1 + BASELINE) / 2;
const markY = markCY - S / 2;
const markScale = S / 32;

const pad = 0.05 * (ink.y2 - ink.y1); // tight border
const minX = ink.x1 - pad;
const minY = Math.min(ink.y1, markY) - pad;
const maxX = markX + S + pad;
const maxY = Math.max(ink.y2, markY + S) + pad;
const w = maxX - minX;
const h = maxY - minY;

const outW = Math.round((w / h) * HEIGHT_PX);
const stones = STONES.map(
  (s) =>
    `<rect x="${s.x}" y="${s.y}" width="9.4" height="9.4" rx="0.8" transform="rotate(45 ${s.cx} ${s.cy})" fill="${s.fill}"/>`,
).join("\n    ");

const svg = `<svg width="${outW}" height="${HEIGHT_PX}" viewBox="${minX} ${minY} ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pod.d}" fill="${ESPRESSO}"/>
  <path d="${raka.d}" fill="${OCHRE}"/>
  <g transform="translate(${markX} ${markY}) scale(${markScale})">
    ${stones}
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(OUT, png);
const meta = await sharp(png).metadata();
console.log(`✓ ${OUT} — ${meta.width}×${meta.height}px, transparent background`);

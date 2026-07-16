// Renders the PaveMark alone (four stones, no wordmark) as a tightly-cropped
// transparent PNG: marketing/logo-mark.png (1024×1024).
//   node scripts/make-logo-mark.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const SIZE = 1024;
const STONES = [
  { x: 3.9, y: 11.3, cx: 8.6, cy: 16, fill: "#a37010" }, // left  (cobble-700)
  { x: 11.3, y: 18.7, cx: 16, cy: 23.4, fill: "#e0a019" }, // bottom (cobble-500)
  { x: 18.7, y: 11.3, cx: 23.4, cy: 16, fill: "#e8bc5c" }, // right (cobble-300)
  { x: 11.3, y: 3.9, cx: 16, cy: 8.6, fill: "#e4ab35" }, // top   (cobble-400)
];

// Stones span ~1.95..30.05 in the 32-unit box — crop with a whisper of margin.
const svg = `<svg width="${SIZE}" height="${SIZE}" viewBox="1.7 1.7 28.6 28.6" xmlns="http://www.w3.org/2000/svg">
${STONES.map(
  (s) =>
    `  <rect x="${s.x}" y="${s.y}" width="9.4" height="9.4" rx="0.8" transform="rotate(45 ${s.cx} ${s.cy})" fill="${s.fill}"/>`,
).join("\n")}
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync("marketing/logo-mark.png", png);
const meta = await sharp(png).metadata();
console.log(`✓ marketing/logo-mark.png — ${meta.width}×${meta.height}px, transparent background`);

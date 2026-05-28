// Rasterize the brand SVG into the PNGs iOS / older Android need.
//
// iOS Safari does NOT accept SVG for `apple-touch-icon` — without a PNG
// the home-screen icon falls back to a screenshot of the page. Modern
// Android Chrome accepts SVG via the manifest, so this only adds the
// missing iOS path and a 192×192 PNG fallback for legacy platforms.
//
// Run once per icon change: `node scripts/rasterize-icons.mjs`.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SRC = resolve(root, "src/app/icon.svg");
const OUT = [
  // Apple touch icon — required size per Apple's documentation.
  { path: "public/apple-icon-180.png", size: 180 },
  // Legacy Android / generic PWA fallback.
  { path: "public/icon-192.png", size: 192 },
];

const svg = readFileSync(SRC);

for (const { path, size } of OUT) {
  const dst = resolve(root, path);
  await sharp(svg, { density: 384 }) // upscale density so paths render crisp
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then((buf) => writeFileSync(dst, buf));
  console.log(`  wrote ${path} (${size}×${size})`);
}

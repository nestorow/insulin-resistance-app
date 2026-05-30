// Generates public/og-image.png (1200×630) for social sharing previews.
// Run: npm run og:gen
//
// Renders an SVG to PNG via Sharp. Standardized to match the ThyroidRehab
// card: dark→light teal gradient, "PWA · BG" eyebrow, big brand name, a
// two-line Cyrillic tagline, feature pills, the domain in gold, and the
// InsulinReset brand mark (the decaying insulin-spikes wave) in a translucent
// rounded panel on the right.
//
// If you change brand colors, the logo, or the wording — re-run this script
// and commit the regenerated public/og-image.png.

import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "og-image.png");

const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B322C"/>
      <stop offset="55%" stop-color="#1B7A6E"/>
      <stop offset="100%" stop-color="#47AF87"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F5D060" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#F5D060" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative ambient blobs -->
  <circle cx="1080" cy="120" r="260" fill="url(#glow)"/>
  <circle cx="-40" cy="640" r="280" fill="#47AF87" opacity="0.18"/>
  <circle cx="980" cy="540" r="120" fill="#F5D060" opacity="0.08"/>

  <!-- LEFT: text block -->
  <g font-family="'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif">
    <!-- Eyebrow -->
    <g transform="translate(80, 140)">
      <rect x="0" y="0" width="180" height="44" rx="22" fill="#FFFFFF" fill-opacity="0.12"/>
      <text x="90" y="29" text-anchor="middle" font-size="20" font-weight="600" fill="#F5D060" letter-spacing="1.5">PWA · BG</text>
    </g>

    <!-- Headline -->
    <text x="80" y="270" font-size="92" font-weight="800" fill="#FFFFFF" letter-spacing="-1">InsulinReset</text>

    <!-- Tagline (Cyrillic) -->
    <text x="80" y="335" font-size="38" font-weight="600" fill="#E8F5F0">90-дневен протокол за</text>
    <text x="80" y="380" font-size="38" font-weight="600" fill="#E8F5F0">инсулинова резистентност</text>

    <!-- Feature row -->
    <g transform="translate(80, 430)" font-size="22" font-weight="500" fill="#0B322C">
      <g>
        <rect x="0" y="0" width="148" height="44" rx="22" fill="#E8F5F0"/>
        <text x="74" y="29" text-anchor="middle">Дневен план</text>
      </g>
      <g transform="translate(160, 0)">
        <rect x="0" y="0" width="118" height="44" rx="22" fill="#E8F5F0"/>
        <text x="59" y="29" text-anchor="middle">Маркери</text>
      </g>
      <g transform="translate(290, 0)">
        <rect x="0" y="0" width="86" height="44" rx="22" fill="#E8F5F0"/>
        <text x="43" y="29" text-anchor="middle">CGM</text>
      </g>
      <g transform="translate(388, 0)">
        <rect x="0" y="0" width="128" height="44" rx="22" fill="#E8F5F0"/>
        <text x="64" y="29" text-anchor="middle">Симптоми</text>
      </g>
    </g>

    <!-- URL -->
    <g transform="translate(80, 530)">
      <text x="0" y="24" font-size="24" font-weight="600" fill="#F5D060" letter-spacing="0.5">insulin-reset.bg</text>
    </g>
  </g>

  <!-- RIGHT: brand mark (the insulin-spikes wave) in a translucent panel.
       The tile is the app icon (src/app/icon.svg, viewBox 32×32) scaled up. -->
  <rect x="745" y="120" width="390" height="390" rx="90" fill="#FFFFFF" opacity="0.10"/>
  <g transform="translate(790, 165) scale(9.375)">
    <rect width="32" height="32" rx="7" fill="#1B7A6E"/>
    <path d="M 4 16 Q 7 5 10 16 Q 13 27 16 16 Q 18.5 9 21 16 L 28 16"
          stroke="#F0FAF6" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- Subtle bottom border accent -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#F5D060" opacity="0.6"/>
</svg>`;

async function main() {
  await mkdir(dirname(OUT), { recursive: true });

  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H, { fit: "fill" })
    .png({ compressionLevel: 9, quality: 95 })
    .toBuffer();

  await writeFile(OUT, png);

  const meta = await sharp(png).metadata();
  console.log(`Wrote ${OUT}`);
  console.log(`  size: ${meta.width}×${meta.height}  (${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

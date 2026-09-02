// Fonts must be self-hosted through next/font: a Google Fonts `@import` in
// globals.css is a render-blocking cross-origin chain (CSS → fonts.googleapis
// → fonts.gstatic) that Lighthouse measured at ~2.2 s on the landing page.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const globalsCss = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const layoutTsx = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("font loading", () => {
  it("globals.css does not @import Google Fonts (render-blocking)", () => {
    expect(globalsCss).not.toMatch(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com/);
  });

  it("layout.tsx loads Montserrat + Nunito Sans through next/font/google", () => {
    expect(layoutTsx).toMatch(/from "next\/font\/google"/);
    expect(layoutTsx).toMatch(/Montserrat\(/);
    expect(layoutTsx).toMatch(/Nunito_Sans\(/);
  });

  it("the design tokens reference the next/font CSS variables", () => {
    expect(globalsCss).toMatch(/--font-heading:\s*var\(--font-montserrat\)/);
    expect(globalsCss).toMatch(/--font-body:\s*var\(--font-nunito-sans\)/);
  });
});

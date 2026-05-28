import type { MetadataRoute } from "next";

// PWA manifest — makes the app installable to home screen on supported
// platforms. Icon is the same SVG used as favicon; modern Android Chrome
// accepts SVG, older targets fall back to default. PNG apple-icon is a
// future polish (needs a build-time rasterization step).

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InsulinReset — 90-дневен протокол",
    short_name: "InsulinReset",
    description:
      "InsulinReset — 90-дневно обръщане на инсулиновата резистентност, базирано на работата на д-р Benjamin Bikman.",
    start_url: "/",
    display: "standalone",
    background_color: "#F0FAF6",
    theme_color: "#1B7A6E",
    lang: "bg",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

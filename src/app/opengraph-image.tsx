import { ImageResponse } from "next/og";

// Site-wide Open Graph card — used by Facebook / X / WhatsApp / LinkedIn
// when someone shares an InsulinReset link. Next.js auto-injects the
// meta tag for every page; per-page overrides can ship their own
// opengraph-image.tsx alongside their route file.

export const alt = "InsulinReset — 90-дневен протокол по д-р Benjamin Bikman";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #E8F5F0 0%, #F0FAF6 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Brand pill */}
        <div
          style={{
            display: "flex",
            background: "#1B7A6E",
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: 700,
            padding: "10px 28px",
            borderRadius: 999,
            marginBottom: 36,
            letterSpacing: 0.5,
          }}
        >
          InsulinReset
        </div>

        {/* Primary line — the promise */}
        <div
          style={{
            display: "flex",
            color: "#114A42",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: 28,
            maxWidth: 980,
          }}
        >
          Свали инсулина си — преди да стане диабет
        </div>

        {/* Secondary line — the method */}
        <div
          style={{
            display: "flex",
            color: "#166258",
            fontSize: 32,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          90-дневен научно обоснован протокол по д-р Benjamin Bikman
        </div>

        {/* Bottom teal band */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "#1B7A6E",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

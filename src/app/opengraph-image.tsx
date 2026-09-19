import { ImageResponse } from "next/og";

export const alt = "Mizan — Automated Liquidity & Settlement Infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#FCFAF7",
          padding: "64px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundImage: "linear-gradient(135deg, #B48F47 0%, #8A6A2A 55%, #5C4512 100%)",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            MZ
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "#1E1B18" }}>
            Mizan
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 56, lineHeight: 1.08, letterSpacing: -0.5, fontWeight: 500, color: "#1E1B18", maxWidth: 900 }}>
            Automated Liquidity &amp; Settlement Infrastructure
          </div>
          <div style={{ fontSize: 24, color: "#706C66", maxWidth: 800 }}>
            Institutional-grade API primitives for automated treasury, cross-border flows, and programmable compliance.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: "#D9AE4E" }} />
          <div style={{ fontSize: 18, color: "#706C66" }}>
            ISO/IEC 27001 aligned · SOC 2 aligned
          </div>
        </div>
      </div>
    ),
    size,
  );
}
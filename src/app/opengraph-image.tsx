import { ImageResponse } from "next/og";

export const alt = "Meridian — Automated Liquidity & Settlement Infrastructure";
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
          backgroundColor: "#FFFFFF",
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
              borderRadius: 12,
              backgroundColor: "#1D1D1F",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "#1D1D1F" }}>
            Meridian
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 56, lineHeight: 1.1, letterSpacing: -1, fontWeight: 600, color: "#1D1D1F", maxWidth: 900 }}>
            Automated Liquidity &amp; Settlement Infrastructure
          </div>
          <div style={{ fontSize: 24, color: "#86868B", maxWidth: 800 }}>
            Institutional-grade API primitives for automated treasury, cross-border flows, and programmable compliance.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: "#0066CC" }} />
          <div style={{ fontSize: 18, color: "#86868B" }}>
            ISO/IEC 27001 aligned · SOC 2 aligned
          </div>
        </div>
      </div>
    ),
    size,
  );
}
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mizan — Automated Liquidity & Settlement Infrastructure",
    short_name: "Mizan",
    description:
      "Mizan is deterministic settlement infrastructure for automated liquidity and 24/7 settlement across 50+ payment rails.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1420",
    theme_color: "#b48f47",
    lang: "en",
  };
}
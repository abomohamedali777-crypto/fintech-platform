import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1D1D1F",
        canvas: "#FFFFFF",
        mist: "#F5F5F7",
        slate: "#86868B",
        accent: "#0066CC",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        micro: "0 2px 8px rgba(0, 0, 0, 0.04)",
        lift: "0 8px 32px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
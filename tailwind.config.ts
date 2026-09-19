import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        slate: "rgb(var(--slate) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Noto Sans", "Noto Sans Arabic", "Noto Sans CJK SC", "Roboto", "sans-serif"],
      },
      boxShadow: {
        micro: "var(--shadow-micro)",
        lift: "var(--shadow-lift)",
      },
    },
  },
  plugins: [],
};

export default config;
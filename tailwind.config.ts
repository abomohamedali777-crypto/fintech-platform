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
        slate: {
          DEFAULT: "rgb(var(--slate) / <alpha-value>)",
          800: "rgb(var(--slate-800) / <alpha-value>)",
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["Cormorant", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Montserrat", "SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Noto Sans", "Noto Sans Arabic", "Noto Sans CJK SC", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        micro: "var(--shadow-micro)",
        gold: "0 18px 50px rgba(161, 98, 7, 0.15)",
        "gold-lg": "0 26px 80px rgba(161, 98, 7, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
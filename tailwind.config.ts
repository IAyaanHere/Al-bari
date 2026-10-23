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
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        warm: {
          50: "#fcfbf7",
          100: "#f8f5ed",
          200: "#f1ebe0",
          300: "#e5dcce",
          400: "#cbbea8",
          500: "#a89981",
          600: "#7c6f5a",
          700: "#5c5243",
          800: "#3d362c",
          900: "#24201a",
        },
        gold: {
          50: "#fffdf0",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#eab308",
          500: "#d97706",
          600: "#b45309",
          700: "#92400e",
          800: "#78350f",
          900: "#451a03",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "system-ui", "-apple-system", "sans-serif"],
        devanagari: ["var(--font-noto-devanagari)", "system-ui", "sans-serif"],
        urdu: ["var(--font-noto-urdu)", "var(--font-noto-sans)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--sans)"],
        mono: ["var(--mono)"],
      },
      colors: {
        bg: "var(--bg)",
        "bg-1": "var(--bg-1)",
        "bg-2": "var(--bg-2)",
        "bg-3": "var(--bg-3)",
        border: "var(--border)",
        "border-2": "var(--border-2)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-mute": "var(--text-mute)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-dim": "var(--accent-dim)",
        "sev-high": "var(--sev-high)",
        "sev-med": "var(--sev-med)",
        "sev-low": "var(--sev-low)",
      },
    },
  },
  plugins: [],
};

export default config;

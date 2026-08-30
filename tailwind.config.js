import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Pins the app's default (non-handwritten) UI text to a font we
      // actually load, instead of leaving it to Preflight's generic
      // system-font stack — which browser/OS-level font substitution
      // (accessibility extensions, reader-font settings, etc.) can silently
      // replace with something that doesn't match the rest of the design.
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        float: {
          // Each floating letter sets --float-rotate inline (its fixed tilt) so
          // the bob animation doesn't stomp over that per-letter rotation.
          "0%, 100%": { transform: "translateY(0px) rotate(var(--float-rotate, 0deg))" },
          "50%": { transform: "translateY(-16px) rotate(var(--float-rotate, 0deg))" },
        },
        // Explicit 0deg -> 360deg (positive = clockwise in CSS) rather than
        // relying on an implicit start state.
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 90s linear infinite",
      },
    },
  },
  plugins: [],
};

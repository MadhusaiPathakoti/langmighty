// Static, hand-placed layout — deliberately not randomized so positions stay
// stable across re-renders instead of jumping around on every state change.
const GLYPHS = [
  // Tamil
  { char: "அ", top: "4%", left: "6%", size: "3.5rem", rotate: -10 },
  { char: "ழ", top: "62%", left: "4%", size: "4rem", rotate: 8 },
  { char: "க", top: "88%", left: "18%", size: "3rem", rotate: -6 },
  { char: "ன", top: "22%", left: "92%", size: "3.2rem", rotate: 12 },

  // Kannada
  { char: "ಕ", top: "10%", left: "34%", size: "4.5rem", rotate: 6 },
  { char: "ಳ", top: "48%", left: "88%", size: "3.5rem", rotate: -8 },
  { char: "ನ", top: "78%", left: "60%", size: "3rem", rotate: 10 },
  { char: "ಮ", top: "6%", left: "70%", size: "3rem", rotate: -4 },

  // Malayalam
  { char: "മ", top: "34%", left: "10%", size: "4rem", rotate: 5 },
  { char: "ഴ", top: "70%", left: "40%", size: "3.5rem", rotate: -12 },
  { char: "ക", top: "90%", left: "78%", size: "3rem", rotate: 7 },
  { char: "ന", top: "16%", left: "54%", size: "2.8rem", rotate: -9 },

  // Telugu
  { char: "త", top: "56%", left: "70%", size: "4rem", rotate: 9 },
  { char: "ళ", top: "82%", left: "6%", size: "3.2rem", rotate: -5 },
  { char: "న", top: "38%", left: "48%", size: "3rem", rotate: 4 },
  { char: "మ", top: "4%", left: "88%", size: "3rem", rotate: -11 },

  // Devanagari (Hindi)
  { char: "क", top: "26%", left: "20%", size: "4.2rem", rotate: -7 },
  { char: "म", top: "94%", left: "46%", size: "3.5rem", rotate: 6 },
  { char: "स", top: "44%", left: "28%", size: "3rem", rotate: 11 },
  { char: "ह", top: "66%", left: "94%", size: "3rem", rotate: -6 },

  // Heritage motifs
  { char: "🕉", top: "12%", left: "12%", size: "3.5rem", rotate: 0 },
  { char: "🪷", top: "58%", left: "54%", size: "3.5rem", rotate: 0 },
  { char: "🦚", top: "30%", left: "80%", size: "3.8rem", rotate: 0 },
  { char: "🪔", top: "84%", left: "88%", size: "3.2rem", rotate: 0 },
];

export default function CulturalBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] text-gray-900 dark:text-gray-100"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      {GLYPHS.map((g, i) => (
        <span
          key={i}
          className="absolute font-bold text-indigo-900 dark:text-indigo-200 opacity-[0.06] dark:opacity-[0.08]"
          style={{ top: g.top, left: g.left, fontSize: g.size, transform: `rotate(${g.rotate}deg)` }}
        >
          {g.char}
        </span>
      ))}
    </div>
  );
}

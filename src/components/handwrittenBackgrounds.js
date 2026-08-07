// CSS-only "paper" backgrounds for the handwritten share-card. Each preset supplies
// a swatch (for the picker thumbnail), the card's layered background, and an ink
// palette tuned for legibility against that paper.
export const HANDWRITTEN_BACKGROUNDS = [
  {
    id: "ruled",
    label: "Ruled Notebook",
    spiral: true,
    marginLeft: 76,
    swatch: "repeating-linear-gradient(0deg, #93a9d9 0px, #93a9d9 1px, #fdfbf3 1px, #fdfbf3 8px)",
    style: {
      backgroundColor: "#fdfbf3",
      backgroundImage: [
        "repeating-linear-gradient(0deg, rgba(99,132,209,0.45) 0px, rgba(99,132,209,0.45) 1px, transparent 1px, transparent 34px)",
        "linear-gradient(90deg, transparent 74px, rgba(214,90,90,0.55) 74px, rgba(214,90,90,0.55) 76px, transparent 76px)",
      ].join(", "),
      backgroundSize: "100% 34px, 100% 100%",
      backgroundRepeat: "repeat, no-repeat",
    },
    ink: { primary: "#1e3a6e", secondary: "#33415f", accent: "#7c2d2d" },
  },
  {
    id: "grid",
    label: "Dot Grid Journal",
    spiral: false,
    marginLeft: 0,
    swatch: "radial-gradient(circle, #9aa0aa 1px, #faf8f2 1.4px)",
    style: {
      backgroundColor: "#faf8f2",
      backgroundImage: "radial-gradient(circle, rgba(90,90,90,0.4) 1px, transparent 1.4px)",
      backgroundSize: "22px 22px",
      backgroundRepeat: "repeat",
    },
    ink: { primary: "#1f2937", secondary: "#4b5563", accent: "#92400e" },
  },
  {
    id: "kraft",
    label: "Kraft Paper",
    spiral: false,
    marginLeft: 0,
    swatch: "linear-gradient(135deg, #c99a63, #a97a48)",
    style: {
      backgroundColor: "#b98a55",
      backgroundImage: [
        "radial-gradient(circle at 18% 25%, rgba(255,255,255,0.10), transparent 60%)",
        "radial-gradient(circle at 82% 75%, rgba(0,0,0,0.16), transparent 55%)",
        "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08))",
      ].join(", "),
      backgroundSize: "cover, cover, cover",
      backgroundRepeat: "no-repeat, no-repeat, no-repeat",
    },
    ink: { primary: "#fff6e2", secondary: "#f4e3bd", accent: "#ffe08a" },
  },
  {
    id: "chalkboard",
    label: "Chalkboard",
    spiral: false,
    marginLeft: 0,
    swatch: "radial-gradient(circle at 30% 30%, #2c4433, #1c2b20)",
    style: {
      backgroundColor: "#1e2f22",
      backgroundImage: [
        "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.05), transparent 6%)",
        "radial-gradient(circle at 70% 60%, rgba(255,255,255,0.04), transparent 5%)",
        "radial-gradient(circle at 40% 80%, rgba(255,255,255,0.04), transparent 5%)",
        "linear-gradient(135deg, rgba(255,255,255,0.04), transparent 40%)",
      ].join(", "),
      backgroundSize: "cover, cover, cover, cover",
      backgroundRepeat: "no-repeat",
    },
    ink: { primary: "#f5f5f0", secondary: "#d8d8d0", accent: "#ffe8a3" },
  },
  {
    id: "stickynote",
    label: "Sticky Note",
    spiral: false,
    marginLeft: 0,
    swatch: "linear-gradient(160deg, #fff9c4, #ffe45e)",
    style: {
      backgroundImage: "linear-gradient(160deg, #fff9c4 0%, #ffe45e 100%)",
    },
    ink: { primary: "#3b3220", secondary: "#5b4d2e", accent: "#8a4b12" },
  },
];

export const DEFAULT_HANDWRITTEN_BACKGROUND_ID = HANDWRITTEN_BACKGROUNDS[0].id;

export function getHandwrittenBackground(id) {
  return HANDWRITTEN_BACKGROUNDS.find((b) => b.id === id) || HANDWRITTEN_BACKGROUNDS[0];
}

// Latin/cursive fonts the user can pick for the English line + romanized pronunciation.
export const LATIN_HANDWRITING_FONTS = [
  { id: "caveat", label: "Caveat", family: "'Caveat', cursive" },
  { id: "kalam", label: "Kalam", family: "'Kalam', cursive" },
  { id: "patrick", label: "Patrick Hand", family: "'Patrick Hand', cursive" },
  { id: "indie", label: "Indie Flower", family: "'Indie Flower', cursive" },
  { id: "shadow", label: "Shadow Into Light", family: "'Shadow Into Light', cursive" },
];

export const DEFAULT_LATIN_FONT_ID = "shadow";

export function getLatinFont(id) {
  return (LATIN_HANDWRITING_FONTS.find((f) => f.id === id) || LATIN_HANDWRITING_FONTS[0]).family;
}

// Native-script font sets. True cursive webfonts don't exist for these scripts, so we
// offer a rounded/informal look (Baloo family) and a clean/formal look (Noto Sans).
export const NATIVE_FONT_SETS = [
  {
    id: "rounded",
    label: "Rounded",
    fonts: {
      telugu: "'Baloo Tammudu 2', cursive",
      hindi: "'Baloo 2', cursive",
      kannada: "'Baloo Tamma 2', cursive",
      malayalam: "'Baloo Chettan 2', cursive",
      tamil: "'Baloo Thambi 2', cursive",
    },
  },
  {
    id: "formal",
    label: "Clean",
    fonts: {
      telugu: "'Noto Sans Telugu', sans-serif",
      hindi: "'Noto Sans Devanagari', sans-serif",
      kannada: "'Noto Sans Kannada', sans-serif",
      malayalam: "'Noto Sans Malayalam', sans-serif",
      tamil: "'Noto Sans Tamil', sans-serif",
    },
  },
];

export const DEFAULT_NATIVE_FONT_SET_ID = NATIVE_FONT_SETS[0].id;

export function getNativeFont(setId, languageKey) {
  const set = NATIVE_FONT_SETS.find((s) => s.id === setId) || NATIVE_FONT_SETS[0];
  return set.fonts[languageKey] || "sans-serif";
}


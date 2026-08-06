export const LANGUAGES = [
  { key: "telugu", label: "Telugu", nativeName: "తెలుగు", ttsVoice: "te-IN-ShrutiNeural", script: /[ఀ-౿]/ },
  { key: "hindi", label: "Hindi", nativeName: "हिन्दी", ttsVoice: "hi-IN-SwaraNeural", script: /[ऀ-ॿ]/ },
  { key: "kannada", label: "Kannada", nativeName: "ಕನ್ನಡ", ttsVoice: "kn-IN-SapnaNeural", script: /[ಀ-೿]/ },
  { key: "malayalam", label: "Malayalam", nativeName: "മലയാളം", ttsVoice: "ml-IN-SobhanaNeural", script: /[ഀ-ൿ]/ },
  { key: "tamil", label: "Tamil", nativeName: "தமிழ்", ttsVoice: "ta-IN-PallaviNeural", script: /[஀-௿]/ },
];

export const DEFAULT_LANGUAGE_KEYS = ["kannada", "malayalam", "tamil"];

// Languages the user can type input in. Includes English (the app's original
// source language) plus every regional language available as a translation target.
export const INPUT_LANGUAGES = [
  { key: "english", label: "English", nativeName: "English", script: /[A-Za-z]/ },
  ...LANGUAGES.map(({ key, label, nativeName, script }) => ({ key, label, nativeName, script })),
];

export const DEFAULT_INPUT_LANGUAGE_KEY = "english";

export function getInputLanguage(key) {
  return INPUT_LANGUAGES.find((l) => l.key === key) || INPUT_LANGUAGES[0];
}

// True if `text` contains at least one character in the given input language's script.
export function matchesScript(text, inputLanguageKey) {
  const lang = getInputLanguage(inputLanguageKey);
  return lang.script.test(text);
}

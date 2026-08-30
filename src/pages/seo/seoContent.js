// Content for the standalone SEO landing pages (src/pages/seo/*). Kept out of
// the main App.jsx view-switcher on purpose — these are indexable routes
// targeting specific search terms, not part of the app's own navigation.

export const LANGUAGE_INFO = {
  english: {
    key: "english",
    label: "English",
    nativeName: "English",
    script: "Latin script",
    speakers: "over 1.5 billion people worldwide, and as a second language across India",
    example: { translation: "Good morning! How are you?", pronunciation: null },
  },
  telugu: {
    key: "telugu",
    label: "Telugu",
    nativeName: "తెలుగు",
    script: "Telugu script",
    speakers: "over 80 million people, mainly in Andhra Pradesh and Telangana",
    example: { translation: "శుభోదయం! మీరు ఎలా ఉన్నారు?", pronunciation: "Shubhodayam! Meeru elaa unnaaru?" },
  },
  hindi: {
    key: "hindi",
    label: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari script",
    speakers: "over 600 million people across North and Central India",
    example: { translation: "सुप्रभात! आप कैसे हैं?", pronunciation: "Suprabhat! Aap kaise hain?" },
  },
  kannada: {
    key: "kannada",
    label: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Kannada script",
    speakers: "over 45 million people, mainly in Karnataka",
    example: { translation: "ಶುಭೋದಯ! ನೀವು ಹೇಗಿದ್ದೀರಿ?", pronunciation: "Shubhodaya! Neevu hegiddeera?" },
  },
  malayalam: {
    key: "malayalam",
    label: "Malayalam",
    nativeName: "മലയാളം",
    script: "Malayalam script",
    speakers: "over 35 million people, mainly in Kerala",
    example: {
      translation: "സുപ്രഭാതം! നിങ്ങൾ എങ്ങനെയുണ്ട്?",
      pronunciation: "Suprabhaatham! Ningal engane undu?",
    },
  },
  tamil: {
    key: "tamil",
    label: "Tamil",
    nativeName: "தமிழ்",
    script: "Tamil script",
    speakers: "over 75 million people across Tamil Nadu, Sri Lanka, and Singapore",
    example: {
      translation: "காலை வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?",
      pronunciation: "Kaalai vanakkam! Neenga eppadi irukkireenga?",
    },
  },
};

export const LANGUAGE_KEYS = ["telugu", "hindi", "kannada", "malayalam", "tamil"];

// The app can translate FROM any of these six (English + the five Indian
// languages), but only INTO the five Indian ones — English is never a
// translation target (see TranslatePreferences.jsx's outputOptions filter).
// So the valid pair set is 5 (English source) + 5*4 (each Indian language
// source, into the other four) = 25, not a full 6x5/6x6 grid.
export const ALL_LANGUAGE_KEYS = ["english", ...LANGUAGE_KEYS];

export const TRANSLATOR_PAIRS = ALL_LANGUAGE_KEYS.flatMap((from) =>
  LANGUAGE_KEYS.filter((to) => to !== from).map((to) => ({ from, to }))
);

export const AI_TUTOR_CONTENT = {
  title: "AI Language Tutor for Indian Languages",
  description:
    "Chat with an AI language tutor in English, Telugu, Hindi, Kannada, Malayalam, or Tamil. Ask about grammar, vocabulary, and pronunciation, or practice real conversations by voice.",
};

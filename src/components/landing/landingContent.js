// Colors reference Tailwind's palette by name so each section can build both
// a light bg-*-100/text-*-600 pair and a dark bg-*-900/text-*-300 pair without
// repeating the mapping — see colorClasses() below.
export const FEATURES = [
  {
    id: "translation",
    emoji: "🤖",
    color: "indigo",
    title: "AI-Powered Translation",
    description: "Get accurate translations across 5 South Indian languages and Hindi instantly.",
    bullets: [
      "Real-time translation powered by Gemini",
      "Context-aware results with natural phrasing",
      "Supports Telugu, Hindi, Kannada, Malayalam & Tamil",
      "Romanized pronunciation included with every result",
    ],
    mockup: "translation",
  },
  {
    id: "pronunciation",
    emoji: "🔊",
    color: "purple",
    title: "Pronunciation Guide",
    description: "Listen to correct pronunciations in native voices for every translation.",
    bullets: [
      "Native-voice audio for every translation",
      "Romanized (English-letter) phonetic transliteration",
      "One tap to hear any word or sentence",
      "Available across all supported languages",
    ],
    mockup: "pronunciation",
  },
  {
    id: "history",
    emoji: "🕐",
    color: "emerald",
    title: "Conversation History",
    description: "All your translations are saved. Track, revisit, and continue your learning journey.",
    bullets: [
      "Conversation is saved automatically in your browser",
      "Scroll back through everything you've translated",
      "Regenerate or delete any past translation",
      "Export any conversation to a PDF to keep or share",
    ],
    mockup: "history",
  },
  {
    id: "chat",
    emoji: "💬",
    color: "orange",
    title: "AI Chat Tutor",
    description: "Chat with an AI tutor in any language. Ask questions and practice real conversations.",
    bullets: [
      "Ask questions about grammar, vocabulary & pronunciation",
      "Get example sentences with script, pronunciation & meaning",
      "Practice real conversations with an AI language tutor",
      "Export any chat to a PDF to review later",
    ],
    mockup: "chat",
  },
  {
    id: "voice-assistant",
    emoji: "🎙️",
    color: "teal",
    title: "AI Voice Adaptive Chat",
    description:
      "New: Talk with an AI language partner out loud — it replies with real speech in whichever of the six languages you use, and adapts as the conversation goes.",
    bullets: [
      "Speak or type in English, Telugu, Hindi, Kannada, Malayalam, or Tamil",
      "The assistant replies out loud, mirroring whichever language you used",
      "Every reply comes with native script, romanization & an English translation",
      "Teaches you exactly how to answer, not just what it's asking",
      "Follows you when you switch topics or languages mid-conversation",
    ],
    mockup: "voice-assistant",
  },
  {
    id: "playground",
    emoji: "🎮",
    color: "rose",
    title: "Playground: 8 Learning Games",
    description: "Eight different games — audio, visual, text & conversation challenges, all included with your account.",
    bullets: [
      "🎤 Read Aloud — speak a sentence, get instant pronunciation feedback",
      "🧠 Language Quiz — multiple-choice translation practice",
      "🧩 Word Match — tap-to-pair visual matching",
      "⚡ Speed Translate — race the clock, quickfire rounds",
      "🎧 Listen & Guess — audio-only listening challenge",
      "🔗 Word Chain — build sentences by tapping words in order",
      "📝 Guess the Sentence — full-sentence multiple choice with pronunciation",
      "🎭 New: Scenario Roleplay — live-chat an AI character through real scenes (café, directions, market & more) by typing or speaking, then get a personalized feedback report",
    ],
    note: "Every game exercises a different sense — reading, listening, speaking, or racing the clock — so practice never gets stale. Try all 8!",
    mockup: "playground",
  },
  {
    id: "multilang",
    emoji: "🌐",
    color: "sky",
    title: "Multi Language Support",
    description: "Translate between English, Telugu, Hindi, Kannada, Malayalam & Tamil seamlessly.",
    bullets: [
      "Translate between English and 5 Indian languages",
      "Switch your input language at any time",
      "Pick exactly which languages you want translated to",
      "One consistent experience across every language pair",
    ],
    mockup: "multilang",
  },
  {
    id: "pdf-store",
    emoji: "📚",
    color: "amber",
    title: "PDF Store",
    description:
      "Downloadable language-learning PDFs for specific language pairs — preview a few pages free, then unlock the full guide with a one-time purchase.",
    bullets: [
      "Curated PDF guides for specific language pairs",
      "Filter the catalog by the languages you're learning",
      "Free preview pages before you buy",
      "One-time payment via Razorpay — no subscription",
      "Password-protected download, yours to keep forever",
    ],
    mockup: "pdf-store",
  },
];

export const STATS = [
  { value: "6", label: "Languages Supported" },
  { value: "AI", label: "Powered by AI" },
  { value: "∞", label: "Unlimited Translations" },
  { value: "1,000+", label: "Happy Learners" },
];

// Placeholder initials instead of stock photos — see landing page plan notes.
export const TRUST_AVATARS = [
  { initials: "A", color: "indigo" },
  { initials: "S", color: "purple" },
  { initials: "R", color: "emerald" },
];

export const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: "Type a sentence",
    description: "Type or paste any sentence in English, or switch your input language to one of the others.",
  },
  {
    number: 2,
    title: "Choose your languages",
    description: "Pick which of the five Indian languages you want it translated into.",
  },
  {
    number: 3,
    title: "Read & listen",
    description: "See the native script and a romanized pronunciation guide, then tap to hear it spoken aloud.",
  },
  {
    number: 4,
    title: "Save & revisit",
    description: "Your conversation is saved automatically — revisit it anytime or export it to a PDF.",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Which languages does LangMighty support?",
    answer:
      "LangMighty translates between English and five South Indian languages: Telugu, Hindi, Kannada, Malayalam, and Tamil.",
  },
  {
    question: "Is LangMighty free to use?",
    answer:
      "Yes — create a free account or sign in with Google to start translating and chatting, with no limit on how much you use it.",
  },
  {
    question: "Can I hear how a translation is pronounced?",
    answer:
      "Yes. Every translation includes a romanized pronunciation guide, plus a speaker button that plays native-voice audio.",
  },
  {
    question: "Does LangMighty save my translation history?",
    answer:
      "Your conversation is saved automatically in your browser, so you can scroll back through anything you've translated or chatted about.",
  },
  {
    question: "Can I export my translations?",
    answer: "Yes — any conversation, in Translate or AI Chat, can be exported to a PDF to keep or share.",
  },
  {
    question: "What is the AI Chat feature for?",
    answer:
      "It's a language tutor you can ask about grammar, vocabulary, and pronunciation, with example sentences in the target language.",
  },
  {
    question: "What is the AI Voice Adaptive Chat?",
    answer:
      "A spoken back-and-forth with an AI language partner — tap the mic, speak in any of the six languages, and it replies out loud in whichever one you used, mirroring you as the conversation goes and teaching you how to respond, not just what it's asking.",
  },
  {
    question: "What's in the PDF Store?",
    answer:
      "Downloadable language-learning guides for specific language pairs. Preview a few sample pages for free, then unlock the full PDF with a one-time payment — no subscription, no recurring charges.",
  },
];

// Maps a feature's `color` name to a light/dark class pair. Kept in one place
// so every section (grid cards, detail sections, icons) stays consistent.
export function colorClasses(color) {
  const map = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300",
  };
  return map[color] ?? map.indigo;
}

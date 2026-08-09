import { QUIZ_TARGET_LANGUAGES, shuffle } from "./quizData.js";

// Curated sentence bank for the Word Chain game. Each sentence is broken into its
// natural word-by-word order per language — word counts differ across languages
// on purpose (e.g. Malayalam/Tamil often express "I am hungry" as two words where
// Hindi uses four), since that's genuinely how each language segments the idea,
// not an inconsistency to fix.
export const WORD_CHAIN_SENTENCES = [
  {
    id: "feeling-hungry",
    english: "I am feeling hungry",
    translations: {
      telugu: ["నాకు", "ఆకలిగా", "ఉంది"],
      kannada: ["ನನಗೆ", "ಹಸಿವಾಗಿದೆ"],
      hindi: ["मुझे", "भूख", "लगी", "है"],
      malayalam: ["എനിക്ക്", "വിശക്കുന്നു"],
      tamil: ["எனக்கு", "பசிக்கிறது"],
    },
  },
  {
    id: "feeling-thirsty",
    english: "I am feeling thirsty",
    translations: {
      telugu: ["నాకు", "దాహంగా", "ఉంది"],
      kannada: ["ನನಗೆ", "ದಾಹವಾಗಿದೆ"],
      hindi: ["मुझे", "प्यास", "लगी", "है"],
      malayalam: ["എനിക്ക്", "ദാഹിക്കുന്നു"],
      tamil: ["எனக்கு", "தாகமாக", "இருக்கிறது"],
    },
  },
  {
    id: "i-am-fine",
    english: "I am fine",
    translations: {
      telugu: ["నేను", "బాగున్నాను"],
      kannada: ["ನಾನು", "ಚೆನ್ನಾಗಿದ್ದೇನೆ"],
      hindi: ["मैं", "ठीक", "हूँ"],
      malayalam: ["ഞാൻ", "സുഖമായിരിക്കുന്നു"],
      tamil: ["நான்", "நலமாக", "இருக்கிறேன்"],
    },
  },
  {
    id: "what-is-your-name",
    english: "What is your name?",
    translations: {
      telugu: ["మీ", "పేరు", "ఏమిటి"],
      kannada: ["ನಿಮ್ಮ", "ಹೆಸರು", "ಏನು"],
      hindi: ["आपका", "नाम", "क्या", "है"],
      malayalam: ["നിങ്ങളുടെ", "പേര്", "എന്താണ്"],
      tamil: ["உங்கள்", "பெயர்", "என்ன"],
    },
  },
  {
    id: "i-want-water",
    english: "I want water",
    translations: {
      telugu: ["నాకు", "నీళ్ళు", "కావాలి"],
      kannada: ["ನನಗೆ", "ನೀರು", "ಬೇಕು"],
      hindi: ["मुझे", "पानी", "चाहिए"],
      malayalam: ["എനിക്ക്", "വെള്ളം", "വേണം"],
      tamil: ["எனக்கு", "தண்ணீர்", "வேண்டும்"],
    },
  },
  {
    id: "i-love-you",
    english: "I love you",
    translations: {
      telugu: ["నేను", "నిన్ను", "ప్రేమిస్తున్నాను"],
      kannada: ["ನಾನು", "ನಿನ್ನನ್ನು", "ಪ್ರೀತಿಸುತ್ತೇನೆ"],
      hindi: ["मैं", "तुमसे", "प्यार", "करता", "हूँ"],
      malayalam: ["ഞാൻ", "നിന്നെ", "സ്നേഹിക്കുന്നു"],
      tamil: ["நான்", "உன்னை", "காதலிக்கிறேன்"],
    },
  },
  {
    id: "where-are-you-going",
    english: "Where are you going?",
    translations: {
      telugu: ["మీరు", "ఎక్కడికి", "వెళ్తున్నారు"],
      kannada: ["ನೀವು", "ಎಲ್ಲಿಗೆ", "ಹೋಗುತ್ತಿದ್ದೀರಿ"],
      hindi: ["आप", "कहाँ", "जा", "रहे", "हैं"],
      malayalam: ["നിങ്ങൾ", "എവിടെ", "പോകുന്നു"],
      tamil: ["நீங்கள்", "எங்கே", "செல்கிறீர்கள்"],
    },
  },
  {
    id: "going-home",
    english: "I am going home",
    translations: {
      telugu: ["నేను", "ఇంటికి", "వెళ్తున్నాను"],
      kannada: ["ನಾನು", "ಮನೆಗೆ", "ಹೋಗುತ್ತಿದ್ದೇನೆ"],
      hindi: ["मैं", "घर", "जा", "रहा", "हूँ"],
      malayalam: ["ഞാൻ", "വീട്ടിലേക്ക്", "പോകുന്നു"],
      tamil: ["நான்", "வீட்டுக்கு", "செல்கிறேன்"],
    },
  },
  {
    id: "this-is-my-friend",
    english: "This is my friend",
    translations: {
      telugu: ["ఇతను", "నా", "స్నేహితుడు"],
      kannada: ["ಇವನು", "ನನ್ನ", "ಸ್ನೇಹಿತ"],
      hindi: ["यह", "मेरा", "दोस्त", "है"],
      malayalam: ["ഇത്", "എന്റെ", "സുഹൃത്താണ്"],
      tamil: ["இவன்", "என்", "நண்பன்"],
    },
  },
  {
    id: "feeling-tired",
    english: "I am feeling tired",
    translations: {
      telugu: ["నాకు", "అలసటగా", "ఉంది"],
      kannada: ["ನನಗೆ", "ಆಯಾಸವಾಗಿದೆ"],
      hindi: ["मैं", "थका", "हुआ", "हूँ"],
      malayalam: ["എനിക്ക്", "ക്ഷീണം", "ഉണ്ട്"],
      tamil: ["எனக்கு", "சோர்வாக", "இருக்கிறது"],
    },
  },
  {
    id: "feeling-cold",
    english: "I am feeling cold",
    translations: {
      telugu: ["నాకు", "చలిగా", "ఉంది"],
      kannada: ["ನನಗೆ", "ಚಳಿಯಾಗಿದೆ"],
      hindi: ["मुझे", "ठंड", "लग", "रही", "है"],
      malayalam: ["എനിക്ക്", "തണുക്കുന്നു"],
      tamil: ["எனக்கு", "குளிராக", "இருக்கிறது"],
    },
  },
  {
    id: "happy-today",
    english: "I am happy today",
    translations: {
      telugu: ["నేను", "ఈరోజు", "సంతోషంగా", "ఉన్నాను"],
      kannada: ["ನಾನು", "ಇಂದು", "ಸಂತೋಷವಾಗಿದ್ದೇನೆ"],
      hindi: ["मैं", "आज", "खुश", "हूँ"],
      malayalam: ["ഞാൻ", "ഇന്ന്", "സന്തോഷത്തിലാണ്"],
      tamil: ["நான்", "இன்று", "மகிழ்ச்சியாக", "இருக்கிறேன்"],
    },
  },
  {
    id: "thank-you-very-much",
    english: "Thank you very much",
    translations: {
      telugu: ["మీకు", "చాలా", "ధన్యవాదాలు"],
      kannada: ["ನಿಮಗೆ", "ತುಂಬಾ", "ಧನ್ಯವಾದಗಳು"],
      hindi: ["आपको", "बहुत", "धन्यवाद"],
      malayalam: ["നിങ്ങൾക്ക്", "വളരെ", "നന്ദി"],
      tamil: ["உங்களுக்கு", "மிக்க", "நன்றி"],
    },
  },
  {
    id: "please-help-me",
    english: "Please help me",
    translations: {
      telugu: ["దయచేసి", "నాకు", "సహాయం", "చేయండి"],
      kannada: ["ದಯವಿಟ್ಟು", "ನನಗೆ", "ಸಹಾಯ", "ಮಾಡಿ"],
      hindi: ["कृपया", "मेरी", "मदद", "करें"],
      malayalam: ["ദയവായി", "എന്നെ", "സഹായിക്കൂ"],
      tamil: ["தயவுசெய்து", "எனக்கு", "உதவுங்கள்"],
    },
  },
  {
    id: "i-am-a-student",
    english: "I am a student",
    translations: {
      telugu: ["నేను", "విద్యార్థిని"],
      kannada: ["ನಾನು", "ವಿದ್ಯಾರ್ಥಿ"],
      hindi: ["मैं", "छात्र", "हूँ"],
      malayalam: ["ഞാൻ", "വിദ്യാർത്ഥിയാണ്"],
      tamil: ["நான்", "மாணவன்"],
    },
  },
  {
    id: "do-you-speak-english",
    english: "Do you speak English?",
    translations: {
      telugu: ["మీరు", "ఇంగ్లీష్", "మాట్లాడతారా"],
      kannada: ["ನೀವು", "ಇಂಗ್ಲಿಷ್", "ಮಾತನಾಡುತ್ತೀರಾ"],
      hindi: ["आप", "अंग्रेज़ी", "बोलते", "हैं"],
      malayalam: ["നിങ്ങൾ", "ഇംഗ്ലീഷ്", "പറയുമോ"],
      tamil: ["நீங்கள்", "ஆங்கிலம்", "பேசுவீர்களா"],
    },
  },
  {
    id: "i-dont-understand",
    english: "I don't understand",
    translations: {
      telugu: ["నాకు", "అర్థం", "కాలేదు"],
      kannada: ["ನನಗೆ", "ಅರ್ಥವಾಗಲಿಲ್ಲ"],
      hindi: ["मुझे", "समझ", "नहीं", "आया"],
      malayalam: ["എനിക്ക്", "മനസ്സിലായില്ല"],
      tamil: ["எனக்கு", "புரியவில்லை"],
    },
  },
  {
    id: "how-much-does-this-cost",
    english: "How much does this cost?",
    translations: {
      telugu: ["ఇది", "ఎంత"],
      kannada: ["ಇದು", "ಎಷ್ಟು"],
      hindi: ["यह", "कितने", "का", "है"],
      malayalam: ["ഇതിന്", "എത്ര", "വില"],
      tamil: ["இது", "என்ன", "விலை"],
    },
  },
  {
    id: "see-you-tomorrow",
    english: "See you tomorrow",
    translations: {
      telugu: ["రేపు", "కలుద్దాం"],
      kannada: ["ನಾಳೆ", "ಸಿಗೋಣ"],
      hindi: ["कल", "मिलते", "हैं"],
      malayalam: ["നാളെ", "കാണാം"],
      tamil: ["நாளை", "சந்திப்போம்"],
    },
  },
  {
    id: "learning-new-language",
    english: "I am learning a new language",
    translations: {
      telugu: ["నేను", "ఒక", "కొత్త", "భాష", "నేర్చుకుంటున్నాను"],
      kannada: ["ನಾನು", "ಒಂದು", "ಹೊಸ", "ಭಾಷೆ", "ಕಲಿಯುತ್ತಿದ್ದೇನೆ"],
      hindi: ["मैं", "भाषा", "सीख", "रहा", "हूँ"],
      malayalam: ["ഞാൻ", "ഒരു", "പുതിയ", "ഭാഷ", "പഠിക്കുന്നു"],
      tamil: ["நான்", "ஒரு", "புதிய", "மொழி", "கற்கிறேன்"],
    },
  },
  {
    id: "i-have-a-question",
    english: "I have a question",
    translations: {
      telugu: ["నాకు", "ఒక", "ప్రశ్న", "ఉంది"],
      kannada: ["ನನಗೆ", "ಒಂದು", "ಪ್ರಶ್ನೆ", "ಇದೆ"],
      hindi: ["मेरे", "पास", "एक", "सवाल", "है"],
      malayalam: ["എനിക്ക്", "ഒരു", "ചോദ്യമുണ്ട്"],
      tamil: ["எனக்கு", "ஒரு", "கேள்வி", "இருக்கிறது"],
    },
  },
  {
    id: "have-a-nice-day",
    english: "Have a nice day",
    translations: {
      telugu: ["మీ", "రోజు", "బాగుండాలి"],
      kannada: ["ನಿಮ್ಮ", "ದಿನ", "ಚೆನ್ನಾಗಿರಲಿ"],
      hindi: ["आपका", "दिन", "शुभ", "हो"],
      malayalam: ["നിങ്ങളുടെ", "ദിവസം", "നല്ലതാകട്ടെ"],
      tamil: ["உங்கள்", "நாள்", "இனிதாக", "இருக்கட்டும்"],
    },
  },
  {
    id: "i-forgot-my-phone",
    english: "I forgot my phone",
    translations: {
      telugu: ["నేను", "నా", "ఫోన్", "మర్చిపోయాను"],
      kannada: ["ನಾನು", "ನನ್ನ", "ಫೋನ್", "ಮರೆತಿದ್ದೇನೆ"],
      hindi: ["मैं", "अपना", "फ़ोन", "भूल", "गया"],
      malayalam: ["ഞാൻ", "എന്റെ", "ഫോൺ", "മറന്നു"],
      tamil: ["நான்", "என்", "ஃபோனை", "மறந்துவிட்டேன்"],
    },
  },
  {
    id: "i-need-to-go-now",
    english: "I need to go now",
    translations: {
      telugu: ["నేను", "ఇప్పుడు", "వెళ్ళాలి"],
      kannada: ["ನಾನು", "ಈಗ", "ಹೋಗಬೇಕು"],
      hindi: ["मुझे", "अभी", "जाना", "है"],
      malayalam: ["എനിക്ക്", "ഇപ്പോൾ", "പോകണം"],
      tamil: ["எனக்கு", "இப்போது", "போக", "வேண்டும்"],
    },
  },
];

// Builds one round of `count` sentences for a single fixed target language (no
// "mixed" mode here — a word chain only makes sense one language at a time).
// Each sentence's word bank mixes its correct words (shuffled) with a few
// distractor words borrowed from other sentences in the same language, filtered
// so no distractor text collides with a correct word (which would make two tiles
// read identically and confuse "which one is the real one").
export function generateWordChainRound(count, { targetLanguage, excludeIds = [], allSentences = WORD_CHAIN_SENTENCES } = {}) {
  const lang = QUIZ_TARGET_LANGUAGES.includes(targetLanguage) ? targetLanguage : QUIZ_TARGET_LANGUAGES[0];

  // Fresh (not-yet-seen) sentences always come first, only reaching into "stale"
  // (already-seen) ones for whatever's left over — so a round never discards the
  // fresh/stale distinction just because fresh items ran a little short.
  const exclude = new Set(excludeIds);
  const fresh = shuffle(allSentences.filter((s) => !exclude.has(s.id)));
  const stale = shuffle(allSentences.filter((s) => exclude.has(s.id)));
  const chosen = [...fresh, ...stale].slice(0, Math.min(count, allSentences.length));

  const sentences = chosen.map((sentence) => {
    const correctWords = sentence.translations[lang];

    const distractorPool = [
      ...new Set(
        allSentences.filter((s) => s.id !== sentence.id).flatMap((s) => s.translations[lang] ?? [])
      ),
    ].filter((w) => !correctWords.includes(w));
    const distractors = shuffle(distractorPool).slice(0, Math.min(3, distractorPool.length));

    const tiles = shuffle([
      ...correctWords.map((text) => ({ text, correct: true })),
      ...distractors.map((text) => ({ text, correct: false })),
    ]).map((tile, i) => ({ ...tile, tileId: `${sentence.id}-${i}` }));

    return {
      id: sentence.id,
      english: sentence.english,
      targetLanguage: lang,
      correctWords,
      tiles,
    };
  });

  return { sentences, usedIds: sentences.map((s) => s.id) };
}

// Bulk-generated (via scripts/seedGameContent.mjs) and cached in Redis — fetched
// once per session and merged with the static WORD_CHAIN_SENTENCES bank above.
// Falls back to an empty list (so callers just get the static bank) if
// unconfigured, not yet seeded, or the request fails.
let extraSentencesPromise = null;
export function loadExtraSentences() {
  if (!extraSentencesPromise) {
    extraSentencesPromise = fetch("/api/game-content?type=sentences")
      .then((res) => (res.ok ? res.json() : { sentences: [] }))
      .then((data) => (Array.isArray(data.sentences) ? data.sentences : []))
      .catch(() => []);
  }
  return extraSentencesPromise;
}

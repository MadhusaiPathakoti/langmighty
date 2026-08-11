import { apiFetch } from "./lib/apiClient.js";

// Curated phrase bank for the Quiz game. Translations are fixed here (not fetched
// from Gemini) so quiz answers are guaranteed stable and correct — a live API call
// per question would be slower, cost credits, and risk an inconsistent "correct"
// answer between question generation and grading.
export const QUIZ_CATEGORIES = [
  { key: "greetings", label: "Greetings" },
  { key: "relations", label: "Relations" },
  { key: "animals", label: "Animals" },
  { key: "feelings", label: "Feelings" },
  { key: "verbs", label: "Verbs" },
  { key: "nature", label: "Nature" },
  { key: "objects", label: "Objects" },
  { key: "numbers", label: "Numbers" },
  { key: "colors", label: "Colors" },
  { key: "basic", label: "Basic words" },
];

export const QUIZ_PHRASES = [
  // Greetings
  { id: "good-morning", category: "greetings", english: "Good morning", translations: { kannada: "ಶುಭೋದಯ", hindi: "सुप्रभात", malayalam: "സുപ്രഭാതം", tamil: "காலை வணக்கம்", telugu: "శుభోదయం" } },
  { id: "good-night", category: "greetings", english: "Good night", translations: { kannada: "ಶುಭ ರಾತ್ರಿ", hindi: "शुभ रात्रि", malayalam: "ശുഭ രാത്രി", tamil: "இனிய இரவு", telugu: "శుభరాత్రి" } },
  { id: "thank-you", category: "greetings", english: "Thank you", translations: { kannada: "ಧನ್ಯವಾದಗಳು", hindi: "धन्यवाद", malayalam: "നന്ദി", tamil: "நன்றி", telugu: "ధన్యవాదాలు" } },
  { id: "welcome", category: "greetings", english: "Welcome", translations: { kannada: "ಸ್ವಾಗತ", hindi: "स्वागत है", malayalam: "സ്വാഗതം", tamil: "வரவேற்பு", telugu: "స్వాగతం" } },
  { id: "how-are-you", category: "greetings", english: "How are you?", translations: { kannada: "ಹೇಗಿದ್ದೀರಿ?", hindi: "आप कैसे हैं?", malayalam: "സുഖമാണോ?", tamil: "எப்படி இருக்கிறீர்கள்?", telugu: "ఎలా ఉన్నారు?" } },
  { id: "goodbye", category: "greetings", english: "Goodbye", translations: { kannada: "ವಿದಾಯ", hindi: "अलविदा", malayalam: "പോയിവരാം", tamil: "போய் வருகிறேன்", telugu: "వెళ్తాను" } },
  { id: "please", category: "greetings", english: "Please", translations: { kannada: "ದಯವಿಟ್ಟು", hindi: "कृपया", malayalam: "ദയവായി", tamil: "தயவுசெய்து", telugu: "దయచేసి" } },
  { id: "sorry", category: "greetings", english: "Sorry", translations: { kannada: "ಕ್ಷಮಿಸಿ", hindi: "माफ़ करें", malayalam: "ക്ഷമിക്കണം", tamil: "மன்னிக்கவும்", telugu: "క్షమించండి" } },

  // Relations
  { id: "mother", category: "relations", english: "Mother", translations: { kannada: "ಅಮ್ಮ", hindi: "माँ", malayalam: "അമ്മ", tamil: "அம்மா", telugu: "అమ్మ" } },
  { id: "father", category: "relations", english: "Father", translations: { kannada: "ಅಪ್ಪ", hindi: "पिता", malayalam: "അച്ഛൻ", tamil: "அப்பா", telugu: "నాన్న" } },
  { id: "friend", category: "relations", english: "Friend", translations: { kannada: "ಸ್ನೇಹಿತ", hindi: "दोस्त", malayalam: "സുഹൃത്ത്", tamil: "நண்பன்", telugu: "స్నేహితుడు" } },
  { id: "brother", category: "relations", english: "Brother", translations: { kannada: "ಸಹೋದರ", hindi: "भाई", malayalam: "സഹോദരൻ", tamil: "சகோதரன்", telugu: "సోదరుడు" } },
  { id: "sister", category: "relations", english: "Sister", translations: { kannada: "ಸಹೋದರಿ", hindi: "बहन", malayalam: "സഹോദരി", tamil: "சகோதரி", telugu: "సోదరి" } },
  { id: "grandmother", category: "relations", english: "Grandmother", translations: { kannada: "ಅಜ್ಜಿ", hindi: "दादी", malayalam: "അമ്മൂമ്മ", tamil: "பாட்டி", telugu: "అమ్మమ్మ" } },
  { id: "grandfather", category: "relations", english: "Grandfather", translations: { kannada: "ಅಜ್ಜ", hindi: "दादा", malayalam: "അപ്പൂപ്പൻ", tamil: "தாத்தா", telugu: "తాతయ్య" } },
  { id: "son", category: "relations", english: "Son", translations: { kannada: "ಮಗ", hindi: "बेटा", malayalam: "മകൻ", tamil: "மகன்", telugu: "కొడుకు" } },
  { id: "daughter", category: "relations", english: "Daughter", translations: { kannada: "ಮಗಳು", hindi: "बेटी", malayalam: "മകൾ", tamil: "மகள்", telugu: "కూతురు" } },
  { id: "wife", category: "relations", english: "Wife", translations: { kannada: "ಹೆಂಡತಿ", hindi: "पत्नी", malayalam: "ഭാര്യ", tamil: "மனைவி", telugu: "భార్య" } },
  { id: "husband", category: "relations", english: "Husband", translations: { kannada: "ಗಂಡ", hindi: "पति", malayalam: "ഭർത്താവ്", tamil: "கணவன்", telugu: "భర్త" } },

  // Animals
  { id: "dog", category: "animals", english: "Dog", translations: { kannada: "ನಾಯಿ", hindi: "कुत्ता", malayalam: "നായ", tamil: "நாய்", telugu: "కుక్క" } },
  { id: "cat", category: "animals", english: "Cat", translations: { kannada: "ಬೆಕ್ಕು", hindi: "बिल्ली", malayalam: "പൂച്ച", tamil: "பூனை", telugu: "పిల్లి" } },
  { id: "cow", category: "animals", english: "Cow", translations: { kannada: "ಹಸು", hindi: "गाय", malayalam: "പശു", tamil: "பசு", telugu: "ఆవు" } },
  { id: "bird", category: "animals", english: "Bird", translations: { kannada: "ಹಕ್ಕಿ", hindi: "चिड़िया", malayalam: "പക്ഷി", tamil: "பறவை", telugu: "పక్షి" } },
  { id: "elephant", category: "animals", english: "Elephant", translations: { kannada: "ಆನೆ", hindi: "हाथी", malayalam: "ആന", tamil: "யானை", telugu: "ఏనుగు" } },
  { id: "horse", category: "animals", english: "Horse", translations: { kannada: "ಕುದುರೆ", hindi: "घोड़ा", malayalam: "കുതിര", tamil: "குதிரை", telugu: "గుర్రం" } },
  { id: "fish", category: "animals", english: "Fish", translations: { kannada: "ಮೀನು", hindi: "मछली", malayalam: "മീൻ", tamil: "மீன்", telugu: "చేప" } },
  { id: "lion", category: "animals", english: "Lion", translations: { kannada: "ಸಿಂಹ", hindi: "शेर", malayalam: "സിംഹം", tamil: "சிங்கம்", telugu: "సింహం" } },
  { id: "monkey", category: "animals", english: "Monkey", translations: { kannada: "ಮಂಗ", hindi: "बंदर", malayalam: "കുരങ്ങ്", tamil: "குரங்கு", telugu: "కోతి" } },
  { id: "goat", category: "animals", english: "Goat", translations: { kannada: "ಮೇಕೆ", hindi: "बकरी", malayalam: "ആട്", tamil: "ஆடு", telugu: "మేక" } },

  // Feelings
  { id: "happy", category: "feelings", english: "Happy", translations: { kannada: "ಸಂತೋಷ", hindi: "खुश", malayalam: "സന്തോഷം", tamil: "மகிழ்ச்சி", telugu: "సంతోషం" } },
  { id: "sad", category: "feelings", english: "Sad", translations: { kannada: "ದುಃಖ", hindi: "उदास", malayalam: "സങ്കടം", tamil: "சோகம்", telugu: "బాధ" } },
  { id: "angry", category: "feelings", english: "Angry", translations: { kannada: "ಕೋಪ", hindi: "गुस्सा", malayalam: "ദേഷ്യം", tamil: "கோபம்", telugu: "కోపం" } },
  { id: "afraid", category: "feelings", english: "Afraid", translations: { kannada: "ಭಯ", hindi: "डर", malayalam: "ഭയം", tamil: "பயம்", telugu: "భయం" } },
  { id: "tired", category: "feelings", english: "Tired", translations: { kannada: "ಆಯಾಸ", hindi: "थकान", malayalam: "ക്ഷീണം", tamil: "சோர்வு", telugu: "అలసట" } },
  { id: "love", category: "feelings", english: "Love", translations: { kannada: "ಪ್ರೀತಿ", hindi: "प्यार", malayalam: "സ്നേഹം", tamil: "அன்பு", telugu: "ప్రేమ" } },
  { id: "surprise", category: "feelings", english: "Surprise", translations: { kannada: "ಆಶ್ಚರ್ಯ", hindi: "आश्चर्य", malayalam: "ആശ്ചര്യം", tamil: "ஆச்சரியம்", telugu: "ఆశ్చర్యం" } },
  { id: "worried", category: "feelings", english: "Worried", translations: { kannada: "ಚಿಂತೆ", hindi: "चिंता", malayalam: "ആശങ്ക", tamil: "கவலை", telugu: "చింత" } },

  // Verbs
  { id: "eat", category: "verbs", english: "Eat", translations: { kannada: "ತಿನ್ನು", hindi: "खाना", malayalam: "കഴിക്കുക", tamil: "சாப்பிடு", telugu: "తినడం" } },
  { id: "drink", category: "verbs", english: "Drink", translations: { kannada: "ಕುಡಿ", hindi: "पीना", malayalam: "കുടിക്കുക", tamil: "குடி", telugu: "తాగడం" } },
  { id: "go", category: "verbs", english: "Go", translations: { kannada: "ಹೋಗು", hindi: "जाना", malayalam: "പോകുക", tamil: "போ", telugu: "వెళ్ళడం" } },
  { id: "come", category: "verbs", english: "Come", translations: { kannada: "ಬಾ", hindi: "आना", malayalam: "വരിക", tamil: "வா", telugu: "రావడం" } },
  { id: "sleep", category: "verbs", english: "Sleep", translations: { kannada: "ಮಲಗು", hindi: "सोना", malayalam: "ഉറങ്ങുക", tamil: "தூங்கு", telugu: "నిద్రపోవడం" } },
  { id: "read", category: "verbs", english: "Read", translations: { kannada: "ಓದು", hindi: "पढ़ना", malayalam: "വായിക്കുക", tamil: "படி", telugu: "చదవడం" } },
  { id: "write", category: "verbs", english: "Write", translations: { kannada: "ಬರೆ", hindi: "लिखना", malayalam: "എഴുതുക", tamil: "எழுது", telugu: "వ్రాయడం" } },
  { id: "speak", category: "verbs", english: "Speak", translations: { kannada: "ಮಾತಾಡು", hindi: "बोलना", malayalam: "സംസാരിക്കുക", tamil: "பேசு", telugu: "మాట్లాడటం" } },
  { id: "see", category: "verbs", english: "See", translations: { kannada: "ನೋಡು", hindi: "देखना", malayalam: "കാണുക", tamil: "பார்", telugu: "చూడటం" } },
  { id: "play", category: "verbs", english: "Play", translations: { kannada: "ಆಡು", hindi: "खेलना", malayalam: "കളിക്കുക", tamil: "விளையாடு", telugu: "ఆడటం" } },

  // Nature
  { id: "sun", category: "nature", english: "Sun", translations: { kannada: "ಸೂರ್ಯ", hindi: "सूरज", malayalam: "സൂര്യൻ", tamil: "சூரியன்", telugu: "సూర్యుడు" } },
  { id: "moon", category: "nature", english: "Moon", translations: { kannada: "ಚಂದ್ರ", hindi: "चाँद", malayalam: "ചന്ദ്രൻ", tamil: "நிலா", telugu: "చంద్రుడు" } },
  { id: "sky", category: "nature", english: "Sky", translations: { kannada: "ಆಕಾಶ", hindi: "आसमान", malayalam: "ആകാശം", tamil: "வானம்", telugu: "ఆకాశం" } },
  { id: "star", category: "nature", english: "Star", translations: { kannada: "ನಕ್ಷತ್ರ", hindi: "तारा", malayalam: "നക്ഷത്രം", tamil: "நட்சத்திரம்", telugu: "నక్షత్రం" } },
  { id: "rain", category: "nature", english: "Rain", translations: { kannada: "ಮಳೆ", hindi: "बारिश", malayalam: "മഴ", tamil: "மழை", telugu: "వర్షం" } },
  { id: "tree", category: "nature", english: "Tree", translations: { kannada: "ಮರ", hindi: "पेड़", malayalam: "മരം", tamil: "மரம்", telugu: "చెట్టు" } },
  { id: "flower", category: "nature", english: "Flower", translations: { kannada: "ಹೂವು", hindi: "फूल", malayalam: "പൂവ്", tamil: "பூ", telugu: "పువ్వు" } },
  { id: "river", category: "nature", english: "River", translations: { kannada: "ನದಿ", hindi: "नदी", malayalam: "നദി", tamil: "நதி", telugu: "నది" } },
  { id: "mountain", category: "nature", english: "Mountain", translations: { kannada: "ಬೆಟ್ಟ", hindi: "पहाड़", malayalam: "മല", tamil: "மலை", telugu: "కొండ" } },
  { id: "fire", category: "nature", english: "Fire", translations: { kannada: "ಬೆಂಕಿ", hindi: "आग", malayalam: "തീ", tamil: "நெருப்பு", telugu: "మంట" } },

  // Objects
  { id: "book", category: "objects", english: "Book", translations: { kannada: "ಪುಸ್ತಕ", hindi: "किताब", malayalam: "പുസ്തകം", tamil: "புத்தகம்", telugu: "పుస్తకం" } },
  { id: "house", category: "objects", english: "House", translations: { kannada: "ಮನೆ", hindi: "घर", malayalam: "വീട്", tamil: "வீடு", telugu: "ఇల్లు" } },
  { id: "chair", category: "objects", english: "Chair", translations: { kannada: "ಕುರ್ಚಿ", hindi: "कुर्सी", malayalam: "കസേര", tamil: "நாற்காலி", telugu: "కుర్చీ" } },
  { id: "table", category: "objects", english: "Table", translations: { kannada: "ಮೇಜು", hindi: "मेज़", malayalam: "മേശ", tamil: "மேசை", telugu: "బల్ల" } },
  { id: "door", category: "objects", english: "Door", translations: { kannada: "ಬಾಗಿಲು", hindi: "दरवाज़ा", malayalam: "വാതിൽ", tamil: "கதவு", telugu: "తలుపు" } },
  { id: "window", category: "objects", english: "Window", translations: { kannada: "ಕಿಟಕಿ", hindi: "खिड़की", malayalam: "ജനൽ", tamil: "ஜன்னல்", telugu: "కిటికీ" } },
  { id: "pen", category: "objects", english: "Pen", translations: { kannada: "ಪೆನ್ನು", hindi: "कलम", malayalam: "പേന", tamil: "பேனா", telugu: "పెన్ను" } },
  { id: "car", category: "objects", english: "Car", translations: { kannada: "ಕಾರು", hindi: "गाड़ी", malayalam: "കാർ", tamil: "கார்", telugu: "కారు" } },
  { id: "clock", category: "objects", english: "Clock", translations: { kannada: "ಗಡಿಯಾರ", hindi: "घड़ी", malayalam: "ഘടികാരം", tamil: "கடிகாரம்", telugu: "గడియారం" } },
  { id: "key", category: "objects", english: "Key", translations: { kannada: "ಕೀಲಿ", hindi: "चाबी", malayalam: "താക്കോൽ", tamil: "சாவி", telugu: "తాళం చెవి" } },

  // Numbers
  { id: "one", category: "numbers", english: "One", translations: { kannada: "ಒಂದು", hindi: "एक", malayalam: "ഒന്ന്", tamil: "ஒன்று", telugu: "ఒకటి" } },
  { id: "two", category: "numbers", english: "Two", translations: { kannada: "ಎರಡು", hindi: "दो", malayalam: "രണ്ട്", tamil: "இரண்டு", telugu: "రెండు" } },
  { id: "three", category: "numbers", english: "Three", translations: { kannada: "ಮೂರು", hindi: "तीन", malayalam: "മൂന്ന്", tamil: "மூன்று", telugu: "మూడు" } },
  { id: "four", category: "numbers", english: "Four", translations: { kannada: "ನಾಲ್ಕು", hindi: "चार", malayalam: "നാല്", tamil: "நான்கு", telugu: "నాలుగు" } },
  { id: "five", category: "numbers", english: "Five", translations: { kannada: "ಐದು", hindi: "पांच", malayalam: "അഞ്ച്", tamil: "ஐந்து", telugu: "ఐదు" } },
  { id: "six", category: "numbers", english: "Six", translations: { kannada: "ಆರು", hindi: "छह", malayalam: "ആറ്", tamil: "ஆறு", telugu: "ఆరు" } },
  { id: "seven", category: "numbers", english: "Seven", translations: { kannada: "ಏಳು", hindi: "सात", malayalam: "ഏഴ്", tamil: "ஏழு", telugu: "ఏడు" } },
  { id: "eight", category: "numbers", english: "Eight", translations: { kannada: "ಎಂಟು", hindi: "आठ", malayalam: "എട്ട്", tamil: "எட்டு", telugu: "ఎనిమిది" } },
  { id: "nine", category: "numbers", english: "Nine", translations: { kannada: "ಒಂಬತ್ತು", hindi: "नौ", malayalam: "ഒൻപത്", tamil: "ஒன்பது", telugu: "తొమ్మిది" } },
  { id: "ten", category: "numbers", english: "Ten", translations: { kannada: "ಹತ್ತು", hindi: "दस", malayalam: "പത്ത്", tamil: "பத்து", telugu: "పది" } },

  // Colors
  { id: "red", category: "colors", english: "Red", translations: { kannada: "ಕೆಂಪು", hindi: "लाल", malayalam: "ചുവപ്പ്", tamil: "சிவப்பு", telugu: "ఎరుపు" } },
  { id: "blue", category: "colors", english: "Blue", translations: { kannada: "ನೀಲಿ", hindi: "नीला", malayalam: "നീല", tamil: "நீலம்", telugu: "నీలం" } },
  { id: "green", category: "colors", english: "Green", translations: { kannada: "ಹಸಿರು", hindi: "हरा", malayalam: "പച്ച", tamil: "பச்சை", telugu: "ఆకుపచ్చ" } },
  { id: "yellow", category: "colors", english: "Yellow", translations: { kannada: "ಹಳದಿ", hindi: "पीला", malayalam: "മഞ്ഞ", tamil: "மஞ்சள்", telugu: "పసుపు" } },
  { id: "black", category: "colors", english: "Black", translations: { kannada: "ಕಪ್ಪು", hindi: "काला", malayalam: "കറുപ്പ്", tamil: "கருப்பு", telugu: "నలుపు" } },
  { id: "white", category: "colors", english: "White", translations: { kannada: "ಬಿಳಿ", hindi: "सफ़ेद", malayalam: "വെള്ള", tamil: "வெள்ளை", telugu: "తెలుపు" } },

  // Basic words
  { id: "yes", category: "basic", english: "Yes", translations: { kannada: "ಹೌದು", hindi: "हाँ", malayalam: "അതെ", tamil: "ஆம்", telugu: "అవును" } },
  { id: "no", category: "basic", english: "No", translations: { kannada: "ಇಲ್ಲ", hindi: "नहीं", malayalam: "ഇല്ല", tamil: "இல்லை", telugu: "కాదు" } },
  { id: "water", category: "basic", english: "Water", translations: { kannada: "ನೀರು", hindi: "पानी", malayalam: "വെള്ളം", tamil: "தண்ணீர்", telugu: "నీళ్ళు" } },
  { id: "name", category: "basic", english: "Name", translations: { kannada: "ಹೆಸರು", hindi: "नाम", malayalam: "പേര്", tamil: "பெயர்", telugu: "పేరు" } },
  { id: "good", category: "basic", english: "Good", translations: { kannada: "ಒಳ್ಳೆಯದು", hindi: "अच्छा", malayalam: "നല്ലത്", tamil: "நல்லது", telugu: "మంచిది" } },
  { id: "bad", category: "basic", english: "Bad", translations: { kannada: "ಕೆಟ್ಟದು", hindi: "बुरा", malayalam: "മോശം", tamil: "கெட்டது", telugu: "చెడ్డది" } },
  { id: "big", category: "basic", english: "Big", translations: { kannada: "ದೊಡ್ಡ", hindi: "बड़ा", malayalam: "വലുത്", tamil: "பெரியது", telugu: "పెద్దది" } },
  { id: "small", category: "basic", english: "Small", translations: { kannada: "ಚಿಕ್ಕ", hindi: "छोटा", malayalam: "ചെറുത്", tamil: "சிறியது", telugu: "చిన్నది" } },
  { id: "hot", category: "basic", english: "Hot", translations: { kannada: "ಬಿಸಿ", hindi: "गरम", malayalam: "ചൂട്", tamil: "சூடு", telugu: "వేడి" } },
  { id: "cold", category: "basic", english: "Cold", translations: { kannada: "ಚಳಿ", hindi: "ठंडा", malayalam: "തണുപ്പ്", tamil: "குளிர்", telugu: "చలి" } },
];

export const QUIZ_TARGET_LANGUAGES = ["kannada", "hindi", "malayalam", "tamil", "telugu"];

export function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getPhrasesForCategories(categoryKeys, allPhrases = QUIZ_PHRASES) {
  if (!Array.isArray(categoryKeys) || categoryKeys.length === 0) return allPhrases;
  const filtered = allPhrases.filter((p) => categoryKeys.includes(p.category));
  return filtered.length > 0 ? filtered : allPhrases;
}

// Bulk-generated (via scripts/seedGameContent.mjs) and cached in Redis — fetched
// once per session and merged with the static QUIZ_PHRASES bank above. Falls
// back to an empty list (so callers just get the static bank) if unconfigured,
// not yet seeded, or the request fails.
let extraPhrasesPromise = null;
export function loadExtraPhrases() {
  if (!extraPhrasesPromise) {
    extraPhrasesPromise = apiFetch("/api/game-content?type=phrases")
      .then((res) => (res.ok ? res.json() : { phrases: [] }))
      .then((data) => (Array.isArray(data.phrases) ? data.phrases : []))
      .catch(() => []);
  }
  return extraPhrasesPromise;
}

// Accumulates ids seen across rounds (not just the last one) so a word/sentence
// only repeats once every item in the current pool has been shown at least once.
// Resets once the accumulated set covers the whole pool, starting a fresh cycle.
export function trackSeenIds(previousIds, newIds, poolSize) {
  const seen = new Set([...previousIds, ...newIds]);
  return seen.size >= poolSize ? [] : [...seen];
}

function buildQuestion(phrase, fixedLanguage, pool) {
  const targetLanguage =
    fixedLanguage || QUIZ_TARGET_LANGUAGES[Math.floor(Math.random() * QUIZ_TARGET_LANGUAGES.length)];
  const correctAnswer = phrase.translations[targetLanguage];

  const distractorPool = shuffle(
    pool.filter((p) => p.id !== phrase.id).map((p) => p.translations[targetLanguage])
  ).slice(0, 3);

  const options = shuffle([correctAnswer, ...distractorPool]);

  return {
    phraseId: phrase.id,
    english: phrase.english,
    targetLanguage,
    correctAnswer,
    options,
  };
}

// `targetLanguage` of "mixed" (or omitted) randomizes the language per question;
// pass one of QUIZ_TARGET_LANGUAGES to restrict the whole quiz to that language.
// `categoryKeys` restricts the phrase pool to those topics (empty/omitted = all).
// `excludeIds` are phrase ids used in a recent round — skipped where possible so
// replaying doesn't immediately reshow the same words, only falling back to reuse
// once the (filtered) pool is smaller than what's needed to stay fresh.
export function generateQuiz(questionCount, { targetLanguage, categoryKeys, excludeIds = [], allPhrases = QUIZ_PHRASES } = {}) {
  const pool = getPhrasesForCategories(categoryKeys, allPhrases);
  const fixedLanguage = QUIZ_TARGET_LANGUAGES.includes(targetLanguage) ? targetLanguage : null;

  // Fresh (not-yet-seen) items always come first, so a round only reaches into
  // "stale" (already-seen) ones for the leftover slots it has no fresh item for
  // — rather than the old all-or-nothing behavior, which threw away the fresh/
  // stale distinction entirely whenever fresh items ran even one short.
  const exclude = new Set(excludeIds);
  const fresh = shuffle(pool.filter((p) => !exclude.has(p.id)));
  const stale = shuffle(pool.filter((p) => exclude.has(p.id)));
  const ordered = [...fresh, ...stale];

  const questions = [];
  const usedIds = [];
  for (let i = 0; i < questionCount; i++) {
    const phrase = ordered[i % ordered.length];
    questions.push(buildQuestion(phrase, fixedLanguage, pool));
    usedIds.push(phrase.id);
  }
  return { questions, usedIds };
}

// Builds one Word Match round: `pairCount` distinct phrases (no repeats within a
// round, unlike the quiz — a match grid showing the same word twice would be
// broken), each paired with its translation in `targetLanguage` (or a random
// language per pair when "mixed"/omitted). Same excludeIds freshness logic as
// generateQuiz, so replaying doesn't immediately reshow the same word set.
export function generateWordMatchRound(pairCount, { targetLanguage, categoryKeys, excludeIds = [], allPhrases = QUIZ_PHRASES } = {}) {
  const pool = getPhrasesForCategories(categoryKeys, allPhrases);
  const fixedLanguage = QUIZ_TARGET_LANGUAGES.includes(targetLanguage) ? targetLanguage : null;

  const exclude = new Set(excludeIds);
  const fresh = shuffle(pool.filter((p) => !exclude.has(p.id)));
  const stale = shuffle(pool.filter((p) => exclude.has(p.id)));
  const chosen = [...fresh, ...stale].slice(0, Math.min(pairCount, pool.length));

  const pairs = chosen.map((phrase) => {
    const targetLang = fixedLanguage || QUIZ_TARGET_LANGUAGES[Math.floor(Math.random() * QUIZ_TARGET_LANGUAGES.length)];
    return {
      id: phrase.id,
      english: phrase.english,
      targetLanguage: targetLang,
      translation: phrase.translations[targetLang],
    };
  });

  return { pairs, usedIds: pairs.map((p) => p.id) };
}

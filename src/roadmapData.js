export const ROADMAP_LANGUAGES = [
  { key: "telugu", label: "Telugu", nativeName: "తెలుగు" },
  { key: "hindi", label: "Hindi", nativeName: "हिन्दी" },
  { key: "kannada", label: "Kannada", nativeName: "ಕನ್ನಡ" },
  { key: "malayalam", label: "Malayalam", nativeName: "മലയാളം" },
  { key: "tamil", label: "Tamil", nativeName: "தமிழ்" },
];

export const ROADMAP_STAGES = [
  {
    id: "alphabet",
    number: 1,
    title: "Learn the Alphabet",
    blurb:
      "Start with the building blocks: every vowel and consonant letter. Practice reading and writing each one until you recognize it instantly, before moving on.",
  },
  {
    id: "guninthalu",
    number: 2,
    title: "Consonant–Vowel Combinations (Guninthalu)",
    blurb:
      "Combine each consonant with every vowel sign to form new syllables — this is called guninthalu (kagunita). It's the single most important literacy step in Indian scripts: master this pattern and you can sound out almost any word.",
  },
  {
    id: "words",
    number: 3,
    title: "Small Words",
    blurb: "Start reading and writing simple, everyday words built from the letters and combinations you now know.",
  },
  {
    id: "pronouns",
    number: 4,
    title: "Pronouns",
    blurb: "Learn the words that stand in for people and things — I, you, he, she, we, they, this, that.",
  },
  {
    id: "relations",
    number: 5,
    title: "Family, Relations & People",
    blurb: "Learn words for family members and the people around you.",
  },
  {
    id: "bodyparts",
    number: 6,
    title: "Body Parts",
    blurb: "Learn words for parts of the body — useful for describing health, appearance, and everyday actions.",
  },
  {
    id: "animals",
    number: 7,
    title: "Animals",
    blurb: "Learn common animal names, often among the first vocabulary taught to beginners and children.",
  },
  {
    id: "fruits",
    number: 8,
    title: "Fruits",
    blurb: "Learn common fruit names — useful for markets, meals, and everyday conversation.",
  },
  {
    id: "vegetables",
    number: 9,
    title: "Vegetables",
    blurb: "Learn common vegetable names — pairs naturally with fruits for shopping and cooking vocabulary.",
  },
  {
    id: "places",
    number: 10,
    title: "Places",
    blurb: "Learn names for common places you'll need to talk about or navigate to.",
  },
  {
    id: "occupations",
    number: 11,
    title: "Work Names (Occupations)",
    blurb: "Learn words for common jobs and professions — useful for introductions and everyday talk.",
  },
  {
    id: "objects",
    number: 12,
    title: "Everyday Objects",
    blurb: "Learn names for common objects you use or see every day.",
  },
  {
    id: "feelings",
    number: 13,
    title: "Feelings & Emotions",
    blurb: "Learn how to say how you feel — essential for real conversations, not just facts.",
  },
  {
    id: "verbs",
    number: 14,
    title: "Verbs & Verb Forms",
    blurb: "Learn common action words, then how they change to show present, past, and future tense.",
  },
  {
    id: "prepositions",
    number: 15,
    title: "Prepositions",
    blurb: "Learn words that describe position and relationship — in, on, under, near, with — needed to form fuller sentences.",
  },
  {
    id: "adverbs",
    number: 16,
    title: "Adverbs",
    blurb: "Learn words that describe how, when, or how often something happens.",
  },
  {
    id: "conjunctions",
    number: 17,
    title: "Conjunctions",
    blurb: "Learn connector words that let you join ideas into longer, more natural sentences.",
  },
  {
    id: "sentences",
    number: 18,
    title: "Small Sentences",
    blurb: "Combine everything you've learned — nouns, pronouns, verbs — into simple subject–verb–object sentences.",
  },
  {
    id: "questions",
    number: 19,
    title: "Questions & Answers",
    blurb: "Learn common question words (what, where, who) and practice simple question–answer pairs.",
  },
  {
    id: "conversations",
    number: 20,
    title: "Conversations",
    blurb: "Practice short back-and-forth dialogues — greetings, introductions, and everyday small talk.",
  },
  {
    id: "roleplay",
    number: 21,
    title: "Role-Play Conversations",
    blurb:
      "Practice realistic situations — shopping, ordering food, asking for directions — to prepare for real conversations with native speakers.",
  },
];

export const ROADMAP_CONTENT = {
  telugu: {
    alphabet: {
      rows: [
        { native: "అ ఆ ఇ ఈ ఉ ఊ ఋ", roman: "a aa i ii u uu ru", meaning: "vowels (part 1)" },
        { native: "ఎ ఏ ఐ ఒ ఓ ఔ అం అః", roman: "e ee ai o oo au am ah", meaning: "vowels (part 2)" },
        { native: "క ఖ గ ఘ ఙ", roman: "ka kha ga gha nga", meaning: "consonants (group 1)" },
        { native: "చ ఛ జ ఝ ఞ", roman: "cha chha ja jha nya", meaning: "consonants (group 2)" },
        { native: "ట ఠ డ ఢ ణ", roman: "Ta Tha Da Dha Na", meaning: "consonants (group 3)" },
        { native: "త థ ద ధ న", roman: "ta tha da dha na", meaning: "consonants (group 4)" },
        { native: "ప ఫ బ భ మ", roman: "pa pha ba bha ma", meaning: "consonants (group 5)" },
        { native: "య ర ల వ శ ష స హ ళ", roman: "ya ra la va sha sha sa ha La", meaning: "consonants (group 6)" },
      ],
      note: "Practice one row at a time. Say each letter aloud as you write it.",
    },
    guninthalu: {
      rows: [
        { native: "క కా కి కీ కు కూ", roman: "ka kaa ki kii ku kuu", meaning: "క + vowels" },
        { native: "కె కే కై కొ కో కౌ కం కః", roman: "ke kee kai ko koo kau kam kah", meaning: "క + vowels (cont.)" },
        { native: "న నా ని నీ ను నూ నె నే", roman: "na naa ni nii nu nuu ne nee", meaning: "న + vowels" },
        { native: "మ మా మి మీ ము మూ మె మే", roman: "ma maa mi mii mu muu me mee", meaning: "మ + vowels" },
      ],
      note: "This pattern is literally called గుణింతం (guninthamu) in Telugu — the origin of the term. Repeat it for every other consonant.",
    },
    words: {
      rows: [
        { native: "ఇల్లు", roman: "illu", meaning: "house" },
        { native: "నీరు", roman: "neeru", meaning: "water" },
        { native: "అమ్మ", roman: "amma", meaning: "mother" },
        { native: "నాన్న", roman: "naanna", meaning: "father" },
        { native: "పండు", roman: "pandu", meaning: "fruit" },
        { native: "పుస్తకం", roman: "pusthakam", meaning: "book" },
      ],
    },
    pronouns: {
      rows: [
        { native: "నేను", roman: "nenu", meaning: "I" },
        { native: "నువ్వు", roman: "nuvvu", meaning: "you" },
        { native: "అతను", roman: "athanu", meaning: "he" },
        { native: "ఆమె", roman: "aame", meaning: "she" },
        { native: "మేము", roman: "memu", meaning: "we" },
        { native: "వాళ్ళు", roman: "vaallu", meaning: "they" },
        { native: "ఇది", roman: "idi", meaning: "this" },
        { native: "అది", roman: "adi", meaning: "that" },
      ],
    },
    relations: {
      rows: [
        { native: "అమ్మ", roman: "amma", meaning: "mother" },
        { native: "నాన్న", roman: "naanna", meaning: "father" },
        { native: "అన్న", roman: "anna", meaning: "elder brother" },
        { native: "అక్క", roman: "akka", meaning: "elder sister" },
        { native: "తమ్ముడు", roman: "thammudu", meaning: "younger brother" },
        { native: "చెల్లి", roman: "chelli", meaning: "younger sister" },
        { native: "తాత", roman: "thaata", meaning: "grandfather" },
        { native: "అమ్మమ్మ", roman: "ammamma", meaning: "grandmother" },
        { native: "కొడుకు", roman: "koduku", meaning: "son" },
        { native: "కూతురు", roman: "koothuru", meaning: "daughter" },
        { native: "స్నేహితుడు", roman: "snehithudu", meaning: "friend" },
      ],
    },
    bodyparts: {
      rows: [
        { native: "తల", roman: "thala", meaning: "head" },
        { native: "కన్ను", roman: "kannu", meaning: "eye" },
        { native: "ముక్కు", roman: "mukku", meaning: "nose" },
        { native: "నోరు", roman: "noru", meaning: "mouth" },
        { native: "చెయ్యి", roman: "cheyyi", meaning: "hand" },
        { native: "కాలు", roman: "kaalu", meaning: "leg" },
        { native: "చెవి", roman: "chevi", meaning: "ear" },
        { native: "జుట్టు", roman: "juttu", meaning: "hair" },
      ],
    },
    animals: {
      rows: [
        { native: "కుక్క", roman: "kukka", meaning: "dog" },
        { native: "పిల్లి", roman: "pilli", meaning: "cat" },
        { native: "ఆవు", roman: "aavu", meaning: "cow" },
        { native: "ఏనుగు", roman: "yenugu", meaning: "elephant" },
        { native: "పక్షి", roman: "pakshi", meaning: "bird" },
        { native: "చేప", roman: "chepa", meaning: "fish" },
        { native: "గుర్రం", roman: "gurram", meaning: "horse" },
        { native: "పులి", roman: "puli", meaning: "tiger" },
      ],
    },
    fruits: {
      rows: [
        { native: "మామిడి పండు", roman: "maamidi pandu", meaning: "mango" },
        { native: "అరటి పండు", roman: "arati pandu", meaning: "banana" },
        { native: "ఆపిల్", roman: "apple", meaning: "apple" },
        { native: "ద్రాక్ష", roman: "draaksha", meaning: "grapes" },
        { native: "నారింజ", roman: "naaringa", meaning: "orange" },
        { native: "బొప్పాయి", roman: "boppaayi", meaning: "papaya" },
      ],
    },
    vegetables: {
      rows: [
        { native: "బంగాళదుంప", roman: "bangaaladumpa", meaning: "potato" },
        { native: "టమోటా", roman: "tomato", meaning: "tomato" },
        { native: "ఉల్లిపాయ", roman: "ullipaaya", meaning: "onion" },
        { native: "కారెట్", roman: "carrot", meaning: "carrot" },
        { native: "వంకాయ", roman: "vankaaya", meaning: "brinjal" },
        { native: "క్యాబేజీ", roman: "cabbage", meaning: "cabbage" },
      ],
    },
    places: {
      rows: [
        { native: "పాఠశాల", roman: "paatashaala", meaning: "school" },
        { native: "ఆసుపత్రి", roman: "aasupatri", meaning: "hospital" },
        { native: "సంత", roman: "santha", meaning: "market" },
        { native: "గుడి", roman: "gudi", meaning: "temple" },
        { native: "పార్క్", roman: "park", meaning: "park" },
        { native: "రైల్వే స్టేషన్", roman: "railway station", meaning: "railway station" },
      ],
    },
    occupations: {
      rows: [
        { native: "ఉపాధ్యాయుడు", roman: "upaadhyaayudu", meaning: "teacher" },
        { native: "డాక్టర్", roman: "doctor", meaning: "doctor" },
        { native: "రైతు", roman: "raithu", meaning: "farmer" },
        { native: "పోలీసు", roman: "police", meaning: "police officer" },
        { native: "డ్రైవర్", roman: "driver", meaning: "driver" },
        { native: "ఇంజనీర్", roman: "engineer", meaning: "engineer" },
      ],
    },
    objects: {
      rows: [
        { native: "పుస్తకం", roman: "pusthakam", meaning: "book" },
        { native: "పెన్ను", roman: "pennu", meaning: "pen" },
        { native: "బల్ల", roman: "balla", meaning: "table" },
        { native: "కుర్చీ", roman: "kurchi", meaning: "chair" },
        { native: "ఫోన్", roman: "phone", meaning: "phone" },
        { native: "బ్యాగ్", roman: "bag", meaning: "bag" },
      ],
    },
    feelings: {
      rows: [
        { native: "సంతోషం", roman: "santosham", meaning: "happy" },
        { native: "దుఃఖం", roman: "dukham", meaning: "sad" },
        { native: "కోపం", roman: "kopam", meaning: "angry" },
        { native: "భయం", roman: "bhayam", meaning: "afraid" },
        { native: "అలసట", roman: "alasata", meaning: "tired" },
        { native: "ఆకలి", roman: "aakali", meaning: "hungry" },
      ],
    },
    verbs: {
      rows: [
        { native: "వెళ్ళు → వెళ్తున్నాను / వెళ్ళాను", roman: "vellu → velthunnaanu / vellaanu", meaning: "go → I go / I went" },
        { native: "తిను → తింటున్నాను / తిన్నాను", roman: "thinu → thintunnaanu / thinnaanu", meaning: "eat → I eat / I ate" },
        { native: "రా → వస్తున్నాను / వచ్చాను", roman: "raa → vasthunnaanu / vachaanu", meaning: "come → I come / I came" },
      ],
    },
    prepositions: {
      rows: [
        { native: "లో", roman: "lo", meaning: "in" },
        { native: "మీద", roman: "meeda", meaning: "on" },
        { native: "కింద", roman: "kinda", meaning: "under" },
        { native: "దగ్గర", roman: "daggara", meaning: "near" },
        { native: "తో", roman: "tho", meaning: "with" },
        { native: "లేకుండా", roman: "lekunda", meaning: "without" },
      ],
    },
    adverbs: {
      rows: [
        { native: "త్వరగా", roman: "tvaragaa", meaning: "quickly" },
        { native: "నెమ్మదిగా", roman: "nemmadigaa", meaning: "slowly" },
        { native: "ఈరోజు", roman: "eeroju", meaning: "today" },
        { native: "రేపు", roman: "repu", meaning: "tomorrow" },
        { native: "ఇప్పుడు", roman: "ippudu", meaning: "now" },
        { native: "ఎప్పుడూ", roman: "eppudu", meaning: "always" },
      ],
    },
    conjunctions: {
      rows: [
        { native: "మరియు", roman: "mariyu", meaning: "and" },
        { native: "కానీ", roman: "kaani", meaning: "but" },
        { native: "లేదా", roman: "leda", meaning: "or" },
        { native: "ఎందుకంటే", roman: "endukante", meaning: "because" },
        { native: "అందుకే", roman: "anduke", meaning: "so" },
      ],
    },
    sentences: {
      rows: [
        { native: "నేను ఇంటికి వెళ్తున్నాను.", roman: "Nenu intiki velthunnaanu.", meaning: "I am going home." },
        { native: "ఆమె అన్నం తింటుంది.", roman: "Aame annam thintundi.", meaning: "She eats rice." },
        { native: "ఇది నా పుస్తకం.", roman: "Idi naa pusthakam.", meaning: "This is my book." },
      ],
    },
    questions: {
      rows: [
        { native: "మీ పేరు ఏమిటి? → నా పేరు ...", roman: "Mee peru emiti? → Naa peru ...", meaning: "What is your name? → My name is ..." },
        { native: "ఇదేమిటి? → ఇది పుస్తకం.", roman: "Idemiti? → Idi pusthakam.", meaning: "What is this? → This is a book." },
        { native: "మీరు ఎక్కడ నుండి వచ్చారు?", roman: "Meeru ekkada nundi vacharu?", meaning: "Where are you from?" },
      ],
    },
    conversations: {
      rows: [
        { speaker: "A", native: "నమస్కారం! ఎలా ఉన్నారు?", roman: "Namaskaram! Elaa unnaaru?", meaning: "Hello! How are you?" },
        {
          speaker: "B",
          native: "బాగున్నాను, ధన్యవాదాలు. మీరు ఎలా ఉన్నారు?",
          roman: "Baagunnaanu, dhanyavaadaalu. Meeru elaa unnaaru?",
          meaning: "I'm fine, thank you. How are you?",
        },
        { speaker: "A", native: "నేను కూడా బాగున్నాను.", roman: "Nenu kooda baagunnaanu.", meaning: "I'm fine too." },
      ],
    },
    roleplay: {
      note: "At a shop",
      rows: [
        { speaker: "Customer", native: "ఇది ఎంత?", roman: "Idi entha?", meaning: "How much is this?" },
        { speaker: "Shopkeeper", native: "ఇది వంద రూపాయలు.", roman: "Idi vanda roopaayalu.", meaning: "This is 100 rupees." },
        { speaker: "Customer", native: "కొంచెం తగ్గించండి.", roman: "Konchem thagginchandi.", meaning: "Please reduce it a little." },
      ],
    },
  },

  hindi: {
    alphabet: {
      rows: [
        { native: "अ आ इ ई उ ऊ ऋ", roman: "a aa i ii u uu ri", meaning: "vowels (part 1)" },
        { native: "ए ऐ ओ औ अं अः", roman: "e ai o au am ah", meaning: "vowels (part 2)" },
        { native: "क ख ग घ ङ", roman: "ka kha ga gha nga", meaning: "consonants (group 1)" },
        { native: "च छ ज झ ञ", roman: "cha chha ja jha nya", meaning: "consonants (group 2)" },
        { native: "ट ठ ड ढ ण", roman: "Ta Tha Da Dha Na", meaning: "consonants (group 3)" },
        { native: "त थ द ध न", roman: "ta tha da dha na", meaning: "consonants (group 4)" },
        { native: "प फ ब भ म", roman: "pa pha ba bha ma", meaning: "consonants (group 5)" },
        { native: "य र ल व श ष स ह", roman: "ya ra la va sha sha sa ha", meaning: "consonants (group 6)" },
      ],
      note: "Practice one row at a time. Say each letter aloud as you write it.",
    },
    guninthalu: {
      rows: [
        { native: "क का कि की कु कू", roman: "ka kaa ki kii ku kuu", meaning: "क + vowels" },
        { native: "के कै को कौ कं कः", roman: "ke kai ko kau kam kah", meaning: "क + vowels (cont.)" },
        { native: "न ना नि नी नु नू ने नै", roman: "na naa ni nii nu nuu ne nai", meaning: "न + vowels" },
        { native: "म मा मि मी मु मू मे मै", roman: "ma maa mi mii mu muu me mai", meaning: "म + vowels" },
      ],
      note: "In Hindi this is usually called मात्रा (maatraa) rather than guninthalu, but it's the exact same idea. Repeat the pattern for every consonant.",
    },
    words: {
      rows: [
        { native: "घर", roman: "ghar", meaning: "house" },
        { native: "पानी", roman: "paani", meaning: "water" },
        { native: "माँ", roman: "maa", meaning: "mother" },
        { native: "पिता", roman: "pita", meaning: "father" },
        { native: "फल", roman: "phal", meaning: "fruit" },
        { native: "किताब", roman: "kitaab", meaning: "book" },
      ],
    },
    pronouns: {
      rows: [
        { native: "मैं", roman: "main", meaning: "I" },
        { native: "तुम", roman: "tum", meaning: "you" },
        { native: "वह", roman: "vah", meaning: "he" },
        { native: "वह", roman: "vah", meaning: "she" },
        { native: "हम", roman: "ham", meaning: "we" },
        { native: "वे", roman: "ve", meaning: "they" },
        { native: "यह", roman: "yah", meaning: "this" },
        { native: "वह", roman: "vah", meaning: "that" },
      ],
      note: "Hindi doesn't have separate words for 'he' and 'she' — वह (vah) covers both (and also means 'that'); the sentence's verb shows gender instead.",
    },
    relations: {
      rows: [
        { native: "माँ", roman: "maa", meaning: "mother" },
        { native: "पिता", roman: "pita", meaning: "father" },
        { native: "बड़ा भाई", roman: "bada bhai", meaning: "elder brother" },
        { native: "बड़ी बहन", roman: "badi bahan", meaning: "elder sister" },
        { native: "छोटा भाई", roman: "chota bhai", meaning: "younger brother" },
        { native: "छोटी बहन", roman: "chhoti bahan", meaning: "younger sister" },
        { native: "दादा", roman: "dada", meaning: "grandfather" },
        { native: "दादी", roman: "dadi", meaning: "grandmother" },
        { native: "बेटा", roman: "beta", meaning: "son" },
        { native: "बेटी", roman: "beti", meaning: "daughter" },
        { native: "दोस्त", roman: "dost", meaning: "friend" },
      ],
    },
    bodyparts: {
      rows: [
        { native: "सिर", roman: "sir", meaning: "head" },
        { native: "आँख", roman: "aankh", meaning: "eye" },
        { native: "नाक", roman: "naak", meaning: "nose" },
        { native: "मुँह", roman: "muh", meaning: "mouth" },
        { native: "हाथ", roman: "haath", meaning: "hand" },
        { native: "पैर", roman: "pair", meaning: "leg" },
        { native: "कान", roman: "kaan", meaning: "ear" },
        { native: "बाल", roman: "baal", meaning: "hair" },
      ],
    },
    animals: {
      rows: [
        { native: "कुत्ता", roman: "kutta", meaning: "dog" },
        { native: "बिल्ली", roman: "billi", meaning: "cat" },
        { native: "गाय", roman: "gaay", meaning: "cow" },
        { native: "हाथी", roman: "haathi", meaning: "elephant" },
        { native: "चिड़िया", roman: "chidiya", meaning: "bird" },
        { native: "मछली", roman: "machhli", meaning: "fish" },
        { native: "घोड़ा", roman: "ghoda", meaning: "horse" },
        { native: "बाघ", roman: "baagh", meaning: "tiger" },
      ],
    },
    fruits: {
      rows: [
        { native: "आम", roman: "aam", meaning: "mango" },
        { native: "केला", roman: "kela", meaning: "banana" },
        { native: "सेब", roman: "seb", meaning: "apple" },
        { native: "अंगूर", roman: "angoor", meaning: "grapes" },
        { native: "संतरा", roman: "santara", meaning: "orange" },
        { native: "पपीता", roman: "papita", meaning: "papaya" },
      ],
    },
    vegetables: {
      rows: [
        { native: "आलू", roman: "aloo", meaning: "potato" },
        { native: "टमाटर", roman: "tamatar", meaning: "tomato" },
        { native: "प्याज़", roman: "pyaaz", meaning: "onion" },
        { native: "गाजर", roman: "gaajar", meaning: "carrot" },
        { native: "बैंगन", roman: "baingan", meaning: "brinjal" },
        { native: "पत्ता गोभी", roman: "patta gobhi", meaning: "cabbage" },
      ],
    },
    places: {
      rows: [
        { native: "स्कूल", roman: "school", meaning: "school" },
        { native: "अस्पताल", roman: "aspataal", meaning: "hospital" },
        { native: "बाज़ार", roman: "baazaar", meaning: "market" },
        { native: "मंदिर", roman: "mandir", meaning: "temple" },
        { native: "पार्क", roman: "park", meaning: "park" },
        { native: "रेलवे स्टेशन", roman: "railway station", meaning: "railway station" },
      ],
    },
    occupations: {
      rows: [
        { native: "शिक्षक", roman: "shikshak", meaning: "teacher" },
        { native: "डॉक्टर", roman: "doctor", meaning: "doctor" },
        { native: "किसान", roman: "kisaan", meaning: "farmer" },
        { native: "पुलिस", roman: "police", meaning: "police officer" },
        { native: "ड्राइवर", roman: "driver", meaning: "driver" },
        { native: "इंजीनियर", roman: "engineer", meaning: "engineer" },
      ],
    },
    objects: {
      rows: [
        { native: "किताब", roman: "kitaab", meaning: "book" },
        { native: "पेन", roman: "pen", meaning: "pen" },
        { native: "मेज़", roman: "mez", meaning: "table" },
        { native: "कुर्सी", roman: "kursi", meaning: "chair" },
        { native: "फ़ोन", roman: "phone", meaning: "phone" },
        { native: "बैग", roman: "bag", meaning: "bag" },
      ],
    },
    feelings: {
      rows: [
        { native: "खुश", roman: "khush", meaning: "happy" },
        { native: "दुखी", roman: "dukhi", meaning: "sad" },
        { native: "गुस्सा", roman: "gussa", meaning: "angry" },
        { native: "डर", roman: "dar", meaning: "afraid" },
        { native: "थका हुआ", roman: "thaka hua", meaning: "tired" },
        { native: "भूख", roman: "bhookh", meaning: "hungry" },
      ],
    },
    verbs: {
      rows: [
        { native: "जाना → मैं जाता हूँ / मैं गया", roman: "jaana → main jaata hoon / main gaya", meaning: "go → I go / I went" },
        { native: "खाना → मैं खाता हूँ / मैंने खाया", roman: "khaana → main khaata hoon / maine khaaya", meaning: "eat → I eat / I ate" },
        { native: "आना → मैं आता हूँ / मैं आया", roman: "aana → main aata hoon / main aaya", meaning: "come → I come / I came" },
      ],
    },
    prepositions: {
      rows: [
        { native: "में", roman: "mein", meaning: "in" },
        { native: "पर", roman: "par", meaning: "on" },
        { native: "नीचे", roman: "neeche", meaning: "under" },
        { native: "पास", roman: "paas", meaning: "near" },
        { native: "साथ", roman: "saath", meaning: "with" },
        { native: "बिना", roman: "bina", meaning: "without" },
      ],
    },
    adverbs: {
      rows: [
        { native: "जल्दी", roman: "jaldi", meaning: "quickly" },
        { native: "धीरे", roman: "dheere", meaning: "slowly" },
        { native: "आज", roman: "aaj", meaning: "today" },
        { native: "कल", roman: "kal", meaning: "tomorrow" },
        { native: "अभी", roman: "abhi", meaning: "now" },
        { native: "हमेशा", roman: "hamesha", meaning: "always" },
      ],
    },
    conjunctions: {
      rows: [
        { native: "और", roman: "aur", meaning: "and" },
        { native: "लेकिन", roman: "lekin", meaning: "but" },
        { native: "या", roman: "ya", meaning: "or" },
        { native: "क्योंकि", roman: "kyonki", meaning: "because" },
        { native: "इसलिए", roman: "isliye", meaning: "so" },
      ],
    },
    sentences: {
      rows: [
        { native: "मैं घर जा रहा हूँ।", roman: "Main ghar ja raha hoon.", meaning: "I am going home." },
        { native: "वह चावल खाती है।", roman: "Vah chaaval khaati hai.", meaning: "She eats rice." },
        { native: "यह मेरी किताब है।", roman: "Yah meri kitaab hai.", meaning: "This is my book." },
      ],
    },
    questions: {
      rows: [
        { native: "आपका नाम क्या है? → मेरा नाम ... है।", roman: "Aapka naam kya hai? → Mera naam ... hai.", meaning: "What is your name? → My name is ..." },
        { native: "यह क्या है? → यह किताब है।", roman: "Yah kya hai? → Yah kitaab hai.", meaning: "What is this? → This is a book." },
        { native: "आप कहाँ से हैं?", roman: "Aap kahaan se hain?", meaning: "Where are you from?" },
      ],
    },
    conversations: {
      rows: [
        { speaker: "A", native: "नमस्ते! आप कैसे हैं?", roman: "Namaste! Aap kaise hain?", meaning: "Hello! How are you?" },
        {
          speaker: "B",
          native: "मैं ठीक हूँ, धन्यवाद। आप कैसे हैं?",
          roman: "Main theek hoon, dhanyavaad. Aap kaise hain?",
          meaning: "I'm fine, thank you. How are you?",
        },
        { speaker: "A", native: "मैं भी ठीक हूँ।", roman: "Main bhi theek hoon.", meaning: "I'm fine too." },
      ],
    },
    roleplay: {
      note: "At a shop",
      rows: [
        { speaker: "Customer", native: "यह कितने का है?", roman: "Yah kitne ka hai?", meaning: "How much is this?" },
        { speaker: "Shopkeeper", native: "यह सौ रुपये का है।", roman: "Yah sau rupaye ka hai.", meaning: "This is 100 rupees." },
        { speaker: "Customer", native: "थोड़ा कम कर दो।", roman: "Thoda kam kar do.", meaning: "Please reduce it a little." },
      ],
    },
  },

  kannada: {
    alphabet: {
      rows: [
        { native: "ಅ ಆ ಇ ಈ ಉ ಊ ಋ", roman: "a aa i ii u uu ru", meaning: "vowels (part 1)" },
        { native: "ಎ ಏ ಐ ಒ ಓ ಔ ಅಂ ಅಃ", roman: "e ee ai o oo au am ah", meaning: "vowels (part 2)" },
        { native: "ಕ ಖ ಗ ಘ ಙ", roman: "ka kha ga gha nga", meaning: "consonants (group 1)" },
        { native: "ಚ ಛ ಜ ಝ ಞ", roman: "cha chha ja jha nya", meaning: "consonants (group 2)" },
        { native: "ಟ ಠ ಡ ಢ ಣ", roman: "Ta Tha Da Dha Na", meaning: "consonants (group 3)" },
        { native: "ತ ಥ ದ ಧ ನ", roman: "ta tha da dha na", meaning: "consonants (group 4)" },
        { native: "ಪ ಫ ಬ ಭ ಮ", roman: "pa pha ba bha ma", meaning: "consonants (group 5)" },
        { native: "ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ", roman: "ya ra la va sha sha sa ha La", meaning: "consonants (group 6)" },
      ],
      note: "Practice one row at a time. Say each letter aloud as you write it.",
    },
    guninthalu: {
      rows: [
        { native: "ಕ ಕಾ ಕಿ ಕೀ ಕು ಕೂ", roman: "ka kaa ki kii ku kuu", meaning: "ಕ + vowels" },
        { native: "ಕೆ ಕೇ ಕೈ ಕೊ ಕೋ ಕೌ ಕಂ ಕಃ", roman: "ke kee kai ko koo kau kam kah", meaning: "ಕ + vowels (cont.)" },
        { native: "ನ ನಾ ನಿ ನೀ ನು ನೂ ನೆ ನೇ", roman: "na naa ni nii nu nuu ne nee", meaning: "ನ + vowels" },
        { native: "ಮ ಮಾ ಮಿ ಮೀ ಮು ಮೂ ಮೆ ಮೇ", roman: "ma maa mi mii mu muu me mee", meaning: "ಮ + vowels" },
      ],
      note: "Once you can do this for ಕ, ನ, and ಮ, repeat the same pattern for every other consonant.",
    },
    words: {
      rows: [
        { native: "ಮನೆ", roman: "mane", meaning: "house" },
        { native: "ನೀರು", roman: "neeru", meaning: "water" },
        { native: "ಅಮ್ಮ", roman: "amma", meaning: "mother" },
        { native: "ಅಪ್ಪ", roman: "appa", meaning: "father" },
        { native: "ಹಣ್ಣು", roman: "hannu", meaning: "fruit" },
        { native: "ಪುಸ್ತಕ", roman: "pustaka", meaning: "book" },
      ],
    },
    pronouns: {
      rows: [
        { native: "ನಾನು", roman: "naanu", meaning: "I" },
        { native: "ನೀನು", roman: "neenu", meaning: "you" },
        { native: "ಅವನು", roman: "avanu", meaning: "he" },
        { native: "ಅವಳು", roman: "avalu", meaning: "she" },
        { native: "ನಾವು", roman: "naavu", meaning: "we" },
        { native: "ಅವರು", roman: "avaru", meaning: "they" },
        { native: "ಇದು", roman: "idu", meaning: "this" },
        { native: "ಅದು", roman: "adu", meaning: "that" },
      ],
    },
    relations: {
      rows: [
        { native: "ಅಮ್ಮ", roman: "amma", meaning: "mother" },
        { native: "ಅಪ್ಪ", roman: "appa", meaning: "father" },
        { native: "ಅಣ್ಣ", roman: "anna", meaning: "elder brother" },
        { native: "ಅಕ್ಕ", roman: "akka", meaning: "elder sister" },
        { native: "ತಮ್ಮ", roman: "tamma", meaning: "younger brother" },
        { native: "ತಂಗಿ", roman: "tangi", meaning: "younger sister" },
        { native: "ಅಜ್ಜ", roman: "ajja", meaning: "grandfather" },
        { native: "ಅಜ್ಜಿ", roman: "ajji", meaning: "grandmother" },
        { native: "ಮಗ", roman: "maga", meaning: "son" },
        { native: "ಮಗಳು", roman: "magalu", meaning: "daughter" },
        { native: "ಸ್ನೇಹಿತ", roman: "snehita", meaning: "friend" },
      ],
    },
    bodyparts: {
      rows: [
        { native: "ತಲೆ", roman: "tale", meaning: "head" },
        { native: "ಕಣ್ಣು", roman: "kannu", meaning: "eye" },
        { native: "ಮೂಗು", roman: "moogu", meaning: "nose" },
        { native: "ಬಾಯಿ", roman: "baayi", meaning: "mouth" },
        { native: "ಕೈ", roman: "kai", meaning: "hand" },
        { native: "ಕಾಲು", roman: "kaalu", meaning: "leg" },
        { native: "ಕಿವಿ", roman: "kivi", meaning: "ear" },
        { native: "ಕೂದಲು", roman: "koodalu", meaning: "hair" },
      ],
    },
    animals: {
      rows: [
        { native: "ನಾಯಿ", roman: "naayi", meaning: "dog" },
        { native: "ಬೆಕ್ಕು", roman: "bekku", meaning: "cat" },
        { native: "ಹಸು", roman: "hasu", meaning: "cow" },
        { native: "ಆನೆ", roman: "aane", meaning: "elephant" },
        { native: "ಹಕ್ಕಿ", roman: "hakki", meaning: "bird" },
        { native: "ಮೀನು", roman: "meenu", meaning: "fish" },
        { native: "ಕುದುರೆ", roman: "kudure", meaning: "horse" },
        { native: "ಹುಲಿ", roman: "huli", meaning: "tiger" },
      ],
    },
    fruits: {
      rows: [
        { native: "ಮಾವಿನಹಣ್ಣು", roman: "maavina hannu", meaning: "mango" },
        { native: "ಬಾಳೆಹಣ್ಣು", roman: "baale hannu", meaning: "banana" },
        { native: "ಸೇಬು", roman: "sebu", meaning: "apple" },
        { native: "ದ್ರಾಕ್ಷಿ", roman: "draakshi", meaning: "grapes" },
        { native: "ಕಿತ್ತಳೆ", roman: "kittale", meaning: "orange" },
        { native: "ಪರಂಗಿ ಹಣ್ಣು", roman: "parangi hannu", meaning: "papaya" },
      ],
    },
    vegetables: {
      rows: [
        { native: "ಆಲೂಗಡ್ಡೆ", roman: "aalugadde", meaning: "potato" },
        { native: "ಟೊಮೇಟೊ", roman: "tomato", meaning: "tomato" },
        { native: "ಈರುಳ್ಳಿ", roman: "eerulli", meaning: "onion" },
        { native: "ಕ್ಯಾರೆಟ್", roman: "carrot", meaning: "carrot" },
        { native: "ಬದನೆಕಾಯಿ", roman: "badanekaayi", meaning: "brinjal" },
        { native: "ಎಲೆಕೋಸು", roman: "elekosu", meaning: "cabbage" },
      ],
    },
    places: {
      rows: [
        { native: "ಶಾಲೆ", roman: "shaale", meaning: "school" },
        { native: "ಆಸ್ಪತ್ರೆ", roman: "aaspatre", meaning: "hospital" },
        { native: "ಮಾರುಕಟ್ಟೆ", roman: "maarukatte", meaning: "market" },
        { native: "ದೇವಸ್ಥಾನ", roman: "devasthaana", meaning: "temple" },
        { native: "ಉದ್ಯಾನವನ", roman: "udyaanavana", meaning: "park" },
        { native: "ರೈಲು ನಿಲ್ದಾಣ", roman: "railu nildaana", meaning: "railway station" },
      ],
    },
    occupations: {
      rows: [
        { native: "ಶಿಕ್ಷಕ", roman: "shikshaka", meaning: "teacher" },
        { native: "ವೈದ್ಯ", roman: "vaidya", meaning: "doctor" },
        { native: "ರೈತ", roman: "raita", meaning: "farmer" },
        { native: "ಪೊಲೀಸ್", roman: "police", meaning: "police officer" },
        { native: "ಚಾಲಕ", roman: "chaalaka", meaning: "driver" },
        { native: "ಇಂಜಿನಿಯರ್", roman: "injiniyar", meaning: "engineer" },
      ],
    },
    objects: {
      rows: [
        { native: "ಪುಸ್ತಕ", roman: "pustaka", meaning: "book" },
        { native: "ಪೆನ್ನು", roman: "pennu", meaning: "pen" },
        { native: "ಮೇಜು", roman: "meju", meaning: "table" },
        { native: "ಕುರ್ಚಿ", roman: "kurchi", meaning: "chair" },
        { native: "ಫೋನ್", roman: "phone", meaning: "phone" },
        { native: "ಚೀಲ", roman: "cheela", meaning: "bag" },
      ],
    },
    feelings: {
      rows: [
        { native: "ಸಂತೋಷ", roman: "santosha", meaning: "happy" },
        { native: "ದುಃಖ", roman: "dukkha", meaning: "sad" },
        { native: "ಕೋಪ", roman: "kopa", meaning: "angry" },
        { native: "ಭಯ", roman: "bhaya", meaning: "afraid" },
        { native: "ಆಯಾಸ", roman: "aayaasa", meaning: "tired" },
        { native: "ಹಸಿವು", roman: "hasivu", meaning: "hungry" },
      ],
    },
    verbs: {
      rows: [
        { native: "ಹೋಗು → ಹೋಗುತ್ತೇನೆ / ಹೋದೆನು", roman: "hogu → hoguttene / hodenu", meaning: "go → I go / I went" },
        { native: "ತಿನ್ನು → ತಿನ್ನುತ್ತೇನೆ / ತಿಂದೆನು", roman: "tinnu → tinnuttene / tindenu", meaning: "eat → I eat / I ate" },
        { native: "ಬಾ → ಬರುತ್ತೇನೆ / ಬಂದೆನು", roman: "baa → baruttene / bandenu", meaning: "come → I come / I came" },
        {
          native: "ಮಾಡು → ಮಾಡುತ್ತೇನೆ / ಮಾಡಿದೆನು / ಮಾಡುವೆನು",
          roman: "maadu → maaduttene / maadidenu / maaduvenu",
          meaning: "do → present / past / future",
        },
      ],
    },
    prepositions: {
      rows: [
        { native: "ಒಳಗೆ", roman: "olage", meaning: "in" },
        { native: "ಮೇಲೆ", roman: "mele", meaning: "on" },
        { native: "ಕೆಳಗೆ", roman: "kelage", meaning: "under" },
        { native: "ಹತ್ತಿರ", roman: "hattira", meaning: "near" },
        { native: "ಜೊತೆ", roman: "jote", meaning: "with" },
        { native: "ಇಲ್ಲದೆ", roman: "illade", meaning: "without" },
      ],
    },
    adverbs: {
      rows: [
        { native: "ಬೇಗ", roman: "bega", meaning: "quickly" },
        { native: "ನಿಧಾನವಾಗಿ", roman: "nidhaanavaagi", meaning: "slowly" },
        { native: "ಇಂದು", roman: "indu", meaning: "today" },
        { native: "ನಾಳೆ", roman: "naale", meaning: "tomorrow" },
        { native: "ಈಗ", roman: "eega", meaning: "now" },
        { native: "ಯಾವಾಗಲೂ", roman: "yaavaagalu", meaning: "always" },
      ],
    },
    conjunctions: {
      rows: [
        { native: "ಮತ್ತು", roman: "mattu", meaning: "and" },
        { native: "ಆದರೆ", roman: "aadare", meaning: "but" },
        { native: "ಅಥವಾ", roman: "athavaa", meaning: "or" },
        { native: "ಏಕೆಂದರೆ", roman: "ekendare", meaning: "because" },
        { native: "ಆದ್ದರಿಂದ", roman: "aaddarinda", meaning: "so" },
      ],
    },
    sentences: {
      rows: [
        { native: "ನಾನು ಮನೆಗೆ ಹೋಗುತ್ತೇನೆ.", roman: "Naanu manege hoguttene.", meaning: "I am going home." },
        { native: "ಅವಳು ಅನ್ನ ತಿನ್ನುತ್ತಾಳೆ.", roman: "Avalu anna tinnuttaale.", meaning: "She eats rice." },
        { native: "ಇದು ನನ್ನ ಪುಸ್ತಕ.", roman: "Idu nanna pustaka.", meaning: "This is my book." },
      ],
    },
    questions: {
      rows: [
        { native: "ನಿಮ್ಮ ಹೆಸರೇನು? → ನನ್ನ ಹೆಸರು ...", roman: "Nimma hesarenu? → Nanna hesaru ...", meaning: "What is your name? → My name is ..." },
        { native: "ಇದೇನು? → ಇದು ಪುಸ್ತಕ.", roman: "Idenu? → Idu pustaka.", meaning: "What is this? → This is a book." },
        { native: "ನೀವು ಎಲ್ಲಿಂದ ಬಂದಿರಿ?", roman: "Neevu ellinda bandiri?", meaning: "Where are you from?" },
      ],
    },
    conversations: {
      rows: [
        { speaker: "A", native: "ನಮಸ್ಕಾರ! ಹೇಗಿದ್ದೀರಿ?", roman: "Namaskara! Hegiddeeri?", meaning: "Hello! How are you?" },
        {
          speaker: "B",
          native: "ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದ. ನೀವು ಹೇಗಿದ್ದೀರಿ?",
          roman: "Chennagiddene, dhanyavaada. Neevu hegiddeeri?",
          meaning: "I'm fine, thank you. How are you?",
        },
        { speaker: "A", native: "ನಾನೂ ಚೆನ್ನಾಗಿದ್ದೇನೆ.", roman: "Naanu chennagiddene.", meaning: "I'm fine too." },
      ],
    },
    roleplay: {
      note: "At a shop",
      rows: [
        { speaker: "Customer", native: "ಇದು ಎಷ್ಟು?", roman: "Idu eshtu?", meaning: "How much is this?" },
        { speaker: "Shopkeeper", native: "ಇದು ನೂರು ರೂಪಾಯಿ.", roman: "Idu nooru rupaayi.", meaning: "This is 100 rupees." },
        { speaker: "Customer", native: "ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ.", roman: "Swalpa kadime maadi.", meaning: "Please reduce it a little." },
      ],
    },
  },

  tamil: {
    alphabet: {
      rows: [
        { native: "அ ஆ இ ஈ உ ஊ", roman: "a aa i ii u uu", meaning: "vowels (part 1)" },
        { native: "எ ஏ ஐ ஒ ஓ ஔ", roman: "e ee ai o oo au", meaning: "vowels (part 2)" },
        { native: "க ங ச ஞ ட ண", roman: "ka nga cha nya Ta Na", meaning: "consonants (part 1)" },
        { native: "த ந ப ம ய ர", roman: "tha na pa ma ya ra", meaning: "consonants (part 2)" },
        { native: "ல வ ழ ள ற ன", roman: "la va zha La ra na", meaning: "consonants (part 3)" },
      ],
      note: "Tamil has fewer base consonants than Kannada or Malayalam, but the same combining principle.",
    },
    guninthalu: {
      rows: [
        { native: "க கா கி கீ கு கூ", roman: "ka kaa ki kii ku kuu", meaning: "க + vowels" },
        { native: "கெ கே கை கொ கோ கௌ", roman: "ke kee kai ko koo kau", meaning: "க + vowels (cont.)" },
        { native: "ந நா நி நீ நு நூ", roman: "na naa ni nii nu nuu", meaning: "ந + vowels" },
        { native: "ம மா மி மீ மு மூ", roman: "ma maa mi mii mu muu", meaning: "ம + vowels" },
      ],
      note: "These are called uyirmei letters (உயிர்மெய் எழுத்துக்கள்) — 'life + body' letters. Repeat the pattern for every consonant.",
    },
    words: {
      rows: [
        { native: "வீடு", roman: "veedu", meaning: "house" },
        { native: "தண்ணீர்", roman: "thanneer", meaning: "water" },
        { native: "அம்மா", roman: "amma", meaning: "mother" },
        { native: "அப்பா", roman: "appa", meaning: "father" },
        { native: "பழம்", roman: "pazham", meaning: "fruit" },
        { native: "புத்தகம்", roman: "puthagam", meaning: "book" },
      ],
    },
    pronouns: {
      rows: [
        { native: "நான்", roman: "naan", meaning: "I" },
        { native: "நீ", roman: "nee", meaning: "you" },
        { native: "அவன்", roman: "avan", meaning: "he" },
        { native: "அவள்", roman: "aval", meaning: "she" },
        { native: "நாங்கள்", roman: "naangal", meaning: "we" },
        { native: "அவர்கள்", roman: "avargal", meaning: "they" },
        { native: "இது", roman: "idhu", meaning: "this" },
        { native: "அது", roman: "adhu", meaning: "that" },
      ],
    },
    relations: {
      rows: [
        { native: "அம்மா", roman: "amma", meaning: "mother" },
        { native: "அப்பா", roman: "appa", meaning: "father" },
        { native: "அண்ணன்", roman: "annan", meaning: "elder brother" },
        { native: "அக்கா", roman: "akka", meaning: "elder sister" },
        { native: "தம்பி", roman: "thambi", meaning: "younger brother" },
        { native: "தங்கை", roman: "thangai", meaning: "younger sister" },
        { native: "தாத்தா", roman: "thaathaa", meaning: "grandfather" },
        { native: "பாட்டி", roman: "paatti", meaning: "grandmother" },
        { native: "மகன்", roman: "magan", meaning: "son" },
        { native: "மகள்", roman: "magal", meaning: "daughter" },
        { native: "நண்பன்", roman: "nanban", meaning: "friend" },
      ],
    },
    bodyparts: {
      rows: [
        { native: "தலை", roman: "thalai", meaning: "head" },
        { native: "கண்", roman: "kan", meaning: "eye" },
        { native: "மூக்கு", roman: "mookku", meaning: "nose" },
        { native: "வாய்", roman: "vaai", meaning: "mouth" },
        { native: "கை", roman: "kai", meaning: "hand" },
        { native: "கால்", roman: "kaal", meaning: "leg" },
        { native: "காது", roman: "kaadhu", meaning: "ear" },
        { native: "முடி", roman: "mudi", meaning: "hair" },
      ],
    },
    animals: {
      rows: [
        { native: "நாய்", roman: "naai", meaning: "dog" },
        { native: "பூனை", roman: "poonai", meaning: "cat" },
        { native: "பசு", roman: "pasu", meaning: "cow" },
        { native: "யானை", roman: "yaanai", meaning: "elephant" },
        { native: "பறவை", roman: "paravai", meaning: "bird" },
        { native: "மீன்", roman: "meen", meaning: "fish" },
        { native: "குதிரை", roman: "kudhirai", meaning: "horse" },
        { native: "புலி", roman: "puli", meaning: "tiger" },
      ],
    },
    fruits: {
      rows: [
        { native: "மாம்பழம்", roman: "maampazham", meaning: "mango" },
        { native: "வாழைப்பழம்", roman: "vaazhaipazham", meaning: "banana" },
        { native: "ஆப்பிள்", roman: "aappil", meaning: "apple" },
        { native: "திராட்சை", roman: "thiraatchai", meaning: "grapes" },
        { native: "ஆரஞ்சு", roman: "aaranju", meaning: "orange" },
        { native: "பப்பாளி", roman: "pappaali", meaning: "papaya" },
      ],
    },
    vegetables: {
      rows: [
        { native: "உருளைக்கிழங்கு", roman: "urulaikizhangu", meaning: "potato" },
        { native: "தக்காளி", roman: "thakkaali", meaning: "tomato" },
        { native: "வெங்காயம்", roman: "vengaayam", meaning: "onion" },
        { native: "கேரட்", roman: "carrot", meaning: "carrot" },
        { native: "கத்தரிக்காய்", roman: "kathirikkaai", meaning: "brinjal" },
        { native: "முட்டைக்கோஸ்", roman: "muttaikose", meaning: "cabbage" },
      ],
    },
    places: {
      rows: [
        { native: "பள்ளி", roman: "palli", meaning: "school" },
        { native: "மருத்துவமனை", roman: "maruthuvamanai", meaning: "hospital" },
        { native: "சந்தை", roman: "santhai", meaning: "market" },
        { native: "கோவில்", roman: "kovil", meaning: "temple" },
        { native: "பூங்கா", roman: "poongaa", meaning: "park" },
        { native: "ரயில் நிலையம்", roman: "rayil nilayam", meaning: "railway station" },
      ],
    },
    occupations: {
      rows: [
        { native: "ஆசிரியர்", roman: "aasiriyar", meaning: "teacher" },
        { native: "மருத்துவர்", roman: "maruthuvar", meaning: "doctor" },
        { native: "விவசாயி", roman: "vivasaayi", meaning: "farmer" },
        { native: "காவலர்", roman: "kaavalar", meaning: "police officer" },
        { native: "ஓட்டுநர்", roman: "ottunar", meaning: "driver" },
        { native: "பொறியாளர்", roman: "poriyaalar", meaning: "engineer" },
      ],
    },
    objects: {
      rows: [
        { native: "புத்தகம்", roman: "puthagam", meaning: "book" },
        { native: "பேனா", roman: "penaa", meaning: "pen" },
        { native: "மேசை", roman: "mesai", meaning: "table" },
        { native: "நாற்காலி", roman: "naarkaali", meaning: "chair" },
        { native: "தொலைபேசி", roman: "tholaipesi", meaning: "phone" },
        { native: "பை", roman: "pai", meaning: "bag" },
      ],
    },
    feelings: {
      rows: [
        { native: "மகிழ்ச்சி", roman: "magizhchi", meaning: "happy" },
        { native: "சோகம்", roman: "sokam", meaning: "sad" },
        { native: "கோபம்", roman: "kopam", meaning: "angry" },
        { native: "பயம்", roman: "payam", meaning: "afraid" },
        { native: "சோர்வு", roman: "sorvu", meaning: "tired" },
        { native: "பசி", roman: "pasi", meaning: "hungry" },
      ],
    },
    verbs: {
      rows: [
        { native: "போ → போகிறேன் / போனேன்", roman: "po → pogiren / ponen", meaning: "go → I go / I went" },
        { native: "சாப்பிடு → சாப்பிடுகிறேன் / சாப்பிட்டேன்", roman: "saappidu → saappidugiren / saappitten", meaning: "eat → I eat / I ate" },
        { native: "வா → வருகிறேன் / வந்தேன்", roman: "vaa → varugiren / vandhen", meaning: "come → I come / I came" },
      ],
    },
    prepositions: {
      rows: [
        { native: "உள்ளே", roman: "ulle", meaning: "in" },
        { native: "மேலே", roman: "mele", meaning: "on" },
        { native: "கீழே", roman: "keezhe", meaning: "under" },
        { native: "அருகில்", roman: "arugil", meaning: "near" },
        { native: "உடன்", roman: "udan", meaning: "with" },
        { native: "இல்லாமல்", roman: "illaamal", meaning: "without" },
      ],
    },
    adverbs: {
      rows: [
        { native: "வேகமாக", roman: "vegamaaga", meaning: "quickly" },
        { native: "மெதுவாக", roman: "medhuvaaga", meaning: "slowly" },
        { native: "இன்று", roman: "indru", meaning: "today" },
        { native: "நாளை", roman: "naalai", meaning: "tomorrow" },
        { native: "இப்போது", roman: "ippodhu", meaning: "now" },
        { native: "எப்போதும்", roman: "eppodhum", meaning: "always" },
      ],
    },
    conjunctions: {
      rows: [
        { native: "மற்றும்", roman: "matrum", meaning: "and" },
        { native: "ஆனால்", roman: "aanaal", meaning: "but" },
        { native: "அல்லது", roman: "alladhu", meaning: "or" },
        { native: "ஏனெனில்", roman: "yenenil", meaning: "because" },
        { native: "எனவே", roman: "enave", meaning: "so" },
      ],
    },
    sentences: {
      rows: [
        { native: "நான் வீட்டிற்கு போகிறேன்.", roman: "Naan veettirku pogiren.", meaning: "I am going home." },
        { native: "அவள் சாதம் சாப்பிடுகிறாள்.", roman: "Aval saatham saappidugiraal.", meaning: "She eats rice." },
        { native: "இது என் புத்தகம்.", roman: "Idhu en puthagam.", meaning: "This is my book." },
      ],
    },
    questions: {
      rows: [
        { native: "உங்கள் பெயர் என்ன? → என் பெயர் ...", roman: "Ungal peyar enna? → En peyar ...", meaning: "What is your name? → My name is ..." },
        { native: "இது என்ன? → இது புத்தகம்.", roman: "Idhu enna? → Idhu puthagam.", meaning: "What is this? → This is a book." },
        { native: "நீங்கள் எங்கிருந்து வந்தீர்கள்?", roman: "Neengal engirundhu vandheergal?", meaning: "Where are you from?" },
      ],
    },
    conversations: {
      rows: [
        { speaker: "A", native: "வணக்கம்! எப்படி இருக்கிறீர்கள்?", roman: "Vanakkam! Eppadi irukkireergal?", meaning: "Hello! How are you?" },
        {
          speaker: "B",
          native: "நலமாக இருக்கிறேன், நன்றி. நீங்கள் எப்படி இருக்கிறீர்கள்?",
          roman: "Nalamaaga irukkiren, nandri. Neengal eppadi irukkireergal?",
          meaning: "I'm fine, thank you. How are you?",
        },
        { speaker: "A", native: "நானும் நலமாக இருக்கிறேன்.", roman: "Naanum nalamaaga irukkiren.", meaning: "I'm fine too." },
      ],
    },
    roleplay: {
      note: "At a shop",
      rows: [
        { speaker: "Customer", native: "இதன் விலை என்ன?", roman: "Idhan vilai enna?", meaning: "What is the price of this?" },
        { speaker: "Shopkeeper", native: "இது நூறு ரூபாய்.", roman: "Idhu nooru rupaai.", meaning: "This is 100 rupees." },
        { speaker: "Customer", native: "கொஞ்சம் குறைவாக சொல்லுங்கள்.", roman: "Konjam kuraivaaga sollungal.", meaning: "Please reduce it a little." },
      ],
    },
  },

  malayalam: {
    alphabet: {
      rows: [
        { native: "അ ആ ഇ ഈ ഉ ഊ ഋ", roman: "a aa i ii u uu ru", meaning: "vowels (part 1)" },
        { native: "എ ഏ ഐ ഒ ഓ ഔ", roman: "e ee ai o oo au", meaning: "vowels (part 2)" },
        { native: "ക ഖ ഗ ഘ ങ", roman: "ka kha ga gha nga", meaning: "consonants (group 1)" },
        { native: "ച ഛ ജ ഝ ഞ", roman: "cha chha ja jha nya", meaning: "consonants (group 2)" },
        { native: "ട ഠ ഡ ഢ ണ", roman: "Ta Tha Da Dha Na", meaning: "consonants (group 3)" },
        { native: "ത ഥ ദ ധ ന", roman: "ta tha da dha na", meaning: "consonants (group 4)" },
        { native: "പ ഫ ബ ഭ മ", roman: "pa pha ba bha ma", meaning: "consonants (group 5)" },
        { native: "യ ര ല വ ശ ഷ സ ഹ ള ഴ റ", roman: "ya ra la va sha sha sa ha La zha ra", meaning: "consonants (group 6)" },
      ],
    },
    guninthalu: {
      rows: [
        { native: "ക കാ കി കീ കു കൂ", roman: "ka kaa ki kii ku kuu", meaning: "ക + vowels" },
        { native: "കെ കേ കൈ കൊ കോ കൗ", roman: "ke kee kai ko koo kau", meaning: "ക + vowels (cont.)" },
        { native: "ന നാ നി നീ നു നൂ", roman: "na naa ni nii nu nuu", meaning: "ന + vowels" },
        { native: "മ മാ മി മീ മു മൂ", roman: "ma maa mi mii mu muu", meaning: "മ + vowels" },
      ],
      note: "Once you can do this for ക, ന, and മ, repeat the same pattern for every other consonant.",
    },
    words: {
      rows: [
        { native: "വീട്", roman: "veedu", meaning: "house" },
        { native: "വെള്ളം", roman: "vellam", meaning: "water" },
        { native: "അമ്മ", roman: "amma", meaning: "mother" },
        { native: "അച്ഛൻ", roman: "achan", meaning: "father" },
        { native: "പഴം", roman: "pazham", meaning: "fruit" },
        { native: "പുസ്തകം", roman: "pusthakam", meaning: "book" },
      ],
    },
    pronouns: {
      rows: [
        { native: "ഞാൻ", roman: "njaan", meaning: "I" },
        { native: "നീ", roman: "nee", meaning: "you" },
        { native: "അവൻ", roman: "avan", meaning: "he" },
        { native: "അവൾ", roman: "aval", meaning: "she" },
        { native: "ഞങ്ങൾ", roman: "njangal", meaning: "we" },
        { native: "അവർ", roman: "avar", meaning: "they" },
        { native: "ഇത്", roman: "ithu", meaning: "this" },
        { native: "അത്", roman: "athu", meaning: "that" },
      ],
    },
    relations: {
      rows: [
        { native: "അമ്മ", roman: "amma", meaning: "mother" },
        { native: "അച്ഛൻ", roman: "achan", meaning: "father" },
        { native: "ചേട്ടൻ", roman: "chettan", meaning: "elder brother" },
        { native: "ചേച്ചി", roman: "chechi", meaning: "elder sister" },
        { native: "അനിയൻ", roman: "aniyan", meaning: "younger brother" },
        { native: "അനിയത്തി", roman: "aniyathi", meaning: "younger sister" },
        { native: "അപ്പൂപ്പൻ", roman: "appooppan", meaning: "grandfather" },
        { native: "അമ്മൂമ്മ", roman: "ammoomma", meaning: "grandmother" },
        { native: "മകൻ", roman: "makan", meaning: "son" },
        { native: "മകൾ", roman: "makal", meaning: "daughter" },
        { native: "സുഹൃത്ത്", roman: "suhruthu", meaning: "friend" },
      ],
    },
    bodyparts: {
      rows: [
        { native: "തല", roman: "thala", meaning: "head" },
        { native: "കണ്ണ്", roman: "kannu", meaning: "eye" },
        { native: "മൂക്ക്", roman: "mookku", meaning: "nose" },
        { native: "വായ്", roman: "vaayu", meaning: "mouth" },
        { native: "കൈ", roman: "kai", meaning: "hand" },
        { native: "കാല്", roman: "kaalu", meaning: "leg" },
        { native: "ചെവി", roman: "chevi", meaning: "ear" },
        { native: "മുടി", roman: "mudi", meaning: "hair" },
      ],
    },
    animals: {
      rows: [
        { native: "നായ", roman: "naaya", meaning: "dog" },
        { native: "പൂച്ച", roman: "poocha", meaning: "cat" },
        { native: "പശു", roman: "pashu", meaning: "cow" },
        { native: "ആന", roman: "aana", meaning: "elephant" },
        { native: "പക്ഷി", roman: "pakshi", meaning: "bird" },
        { native: "മീൻ", roman: "meen", meaning: "fish" },
        { native: "കുതിര", roman: "kuthira", meaning: "horse" },
        { native: "കടുവ", roman: "kaduva", meaning: "tiger" },
      ],
    },
    fruits: {
      rows: [
        { native: "മാങ്ങ", roman: "maanga", meaning: "mango" },
        { native: "വാഴപ്പഴം", roman: "vaazhappazham", meaning: "banana" },
        { native: "ആപ്പിൾ", roman: "aappil", meaning: "apple" },
        { native: "മുന്തിരി", roman: "munthiri", meaning: "grapes" },
        { native: "ഓറഞ്ച്", roman: "orange", meaning: "orange" },
        { native: "പപ്പായ", roman: "pappaya", meaning: "papaya" },
      ],
    },
    vegetables: {
      rows: [
        { native: "ഉരുളക്കിഴങ്ങ്", roman: "urulakizhangu", meaning: "potato" },
        { native: "തക്കാളി", roman: "thakkaali", meaning: "tomato" },
        { native: "സവാള", roman: "savaala", meaning: "onion" },
        { native: "കാരറ്റ്", roman: "carrot", meaning: "carrot" },
        { native: "വഴുതന", roman: "vazhuthana", meaning: "brinjal" },
        { native: "കാബേജ്", roman: "cabbage", meaning: "cabbage" },
      ],
    },
    places: {
      rows: [
        { native: "സ്കൂൾ", roman: "school", meaning: "school" },
        { native: "ആശുപത്രി", roman: "aashupathri", meaning: "hospital" },
        { native: "ചന്ത", roman: "chantha", meaning: "market" },
        { native: "ക്ഷേത്രം", roman: "kshethram", meaning: "temple" },
        { native: "പാർക്ക്", roman: "park", meaning: "park" },
        { native: "റെയിൽവേ സ്റ്റേഷൻ", roman: "railway station", meaning: "railway station" },
      ],
    },
    occupations: {
      rows: [
        { native: "അധ്യാപകൻ", roman: "adhyaapakan", meaning: "teacher" },
        { native: "ഡോക്ടർ", roman: "doctor", meaning: "doctor" },
        { native: "കർഷകൻ", roman: "karshakan", meaning: "farmer" },
        { native: "പോലീസ്", roman: "police", meaning: "police officer" },
        { native: "ഡ്രൈവർ", roman: "driver", meaning: "driver" },
        { native: "എഞ്ചിനീയർ", roman: "engineer", meaning: "engineer" },
      ],
    },
    objects: {
      rows: [
        { native: "പുസ്തകം", roman: "pusthakam", meaning: "book" },
        { native: "പേന", roman: "pena", meaning: "pen" },
        { native: "മേശ", roman: "mesha", meaning: "table" },
        { native: "കസേര", roman: "kasera", meaning: "chair" },
        { native: "ഫോൺ", roman: "phone", meaning: "phone" },
        { native: "ബാഗ്", roman: "bag", meaning: "bag" },
      ],
    },
    feelings: {
      rows: [
        { native: "സന്തോഷം", roman: "santhosham", meaning: "happy" },
        { native: "സങ്കടം", roman: "sankadam", meaning: "sad" },
        { native: "ദേഷ്യം", roman: "deshyam", meaning: "angry" },
        { native: "ഭയം", roman: "bhayam", meaning: "afraid" },
        { native: "ക്ഷീണം", roman: "ksheenam", meaning: "tired" },
        { native: "വിശപ്പ്", roman: "vishappu", meaning: "hungry" },
      ],
    },
    verbs: {
      rows: [
        { native: "പോകുക → പോകുന്നു / പോയി", roman: "pokuka → pokunnu / poyi", meaning: "go → I go / I went" },
        { native: "കഴിക്കുക → കഴിക്കുന്നു / കഴിച്ചു", roman: "kazhikkuka → kazhikkunnu / kazhichu", meaning: "eat → I eat / I ate" },
        { native: "വരിക → വരുന്നു / വന്നു", roman: "varika → varunnu / vannu", meaning: "come → I come / I came" },
      ],
    },
    prepositions: {
      rows: [
        { native: "അകത്ത്", roman: "akathu", meaning: "in" },
        { native: "മുകളിൽ", roman: "mukalil", meaning: "on" },
        { native: "താഴെ", roman: "thaazhe", meaning: "under" },
        { native: "അടുത്ത്", roman: "aduthu", meaning: "near" },
        { native: "കൂടെ", roman: "koode", meaning: "with" },
        { native: "ഇല്ലാതെ", roman: "illaathe", meaning: "without" },
      ],
    },
    adverbs: {
      rows: [
        { native: "വേഗത്തിൽ", roman: "vegathil", meaning: "quickly" },
        { native: "പതുക്കെ", roman: "pathukke", meaning: "slowly" },
        { native: "ഇന്ന്", roman: "innu", meaning: "today" },
        { native: "നാളെ", roman: "naale", meaning: "tomorrow" },
        { native: "ഇപ്പോൾ", roman: "ippol", meaning: "now" },
        { native: "എപ്പോഴും", roman: "eppozhum", meaning: "always" },
      ],
    },
    conjunctions: {
      rows: [
        { native: "ഒപ്പം", roman: "oppam", meaning: "and" },
        { native: "പക്ഷേ", roman: "pakshe", meaning: "but" },
        { native: "അല്ലെങ്കിൽ", roman: "allenkil", meaning: "or" },
        { native: "കാരണം", roman: "kaaranam", meaning: "because" },
        { native: "അതിനാൽ", roman: "athinaal", meaning: "so" },
      ],
    },
    sentences: {
      rows: [
        { native: "ഞാൻ വീട്ടിലേക്ക് പോകുന്നു.", roman: "Njaan veettilekku pokunnu.", meaning: "I am going home." },
        { native: "അവൾ ചോറ് കഴിക്കുന്നു.", roman: "Aval choru kazhikkunnu.", meaning: "She eats rice." },
        { native: "ഇത് എന്റെ പുസ്തകം.", roman: "Ithu ente pusthakam.", meaning: "This is my book." },
      ],
    },
    questions: {
      rows: [
        { native: "നിന്റെ പേരെന്താണ്? → എന്റെ പേര് ...", roman: "Ninte peru enthaanu? → Ente peru ...", meaning: "What is your name? → My name is ..." },
        { native: "ഇതെന്താണ്? → ഇത് ഒരു പുസ്തകമാണ്.", roman: "Ithenthaanu? → Ithu oru pusthakamaanu.", meaning: "What is this? → This is a book." },
        { native: "നിങ്ങൾ എവിടെ നിന്നാണ്?", roman: "Ningal evide ninnaanu?", meaning: "Where are you from?" },
      ],
    },
    conversations: {
      rows: [
        { speaker: "A", native: "നമസ്കാരം! സുഖമാണോ?", roman: "Namaskaram! Sukhamaano?", meaning: "Hello! Are you well?" },
        {
          speaker: "B",
          native: "സുഖമാണ്, നന്ദി. നിങ്ങൾക്ക് സുഖമാണോ?",
          roman: "Sukhamaanu, nandi. Ningalkku sukhamaano?",
          meaning: "I'm well, thank you. Are you well?",
        },
        { speaker: "A", native: "എനിക്കും സുഖമാണ്.", roman: "Enikkum sukhamaanu.", meaning: "I'm well too." },
      ],
    },
    roleplay: {
      note: "At a shop",
      rows: [
        { speaker: "Customer", native: "ഇതിന് എന്ത് വിലയാണ്?", roman: "Ithinu enthu vilayaanu?", meaning: "What is the price of this?" },
        { speaker: "Shopkeeper", native: "ഇതിന് നൂറ് രൂപയാണ്.", roman: "Ithinu nooru roopayaanu.", meaning: "This is 100 rupees." },
        { speaker: "Customer", native: "കുറച്ച് കുറയ്ക്കാമോ?", roman: "Kurachu kurakkaamo?", meaning: "Can you reduce it a little?" },
      ],
    },
  },
};

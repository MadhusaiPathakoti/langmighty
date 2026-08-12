import { LANGUAGES } from "langmighty-shared";
import indiaCultureMap from "../../media/india-culture-map.png";

// Static, non-functional illustrations used in the hero and each feature's
// detail section — purely decorative, so they use fixed example text rather
// than calling the real translate/chat APIs.
const EXAMPLE = {
  telugu: { translation: "శుభోదయం! మీరు ఎలా ఉన్నారు?", pronunciation: "Shubhodayam! Meeru elaa unnaaru?" },
  hindi: { translation: "सुप्रभात! आप कैसे हैं?", pronunciation: "Suprabhat! Aap kaise hain?" },
  kannada: { translation: "ಶುಭೋದಯ! ನೀವು ಹೇಗಿದ್ದೀರಿ?", pronunciation: "Shubhodaya! Neevu hegiddeera?" },
  malayalam: { translation: "സുപ്രഭാതം! നിങ്ങൾ എങ്ങനെയുണ്ട്?", pronunciation: "Suprabhaatham! Ningal engane undu?" },
  tamil: { translation: "காலை வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?", pronunciation: "Kaalai vanakkam! Neenga eppadi irukkireenga?" },
};

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl shadow-indigo-900/5 p-4 sm:p-5">
      {children}
    </div>
  );
}

function TranslationMockup() {
  return (
    <Card>
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">English</div>
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 mb-3">
        Good morning! How are you?
      </div>
      <div className="space-y-2">
        {LANGUAGES.map((lang) => (
          <div key={lang.key} className="flex items-start justify-between gap-2 text-sm">
            <div>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{lang.label}: </span>
              <span className="text-gray-800 dark:text-gray-200">{EXAMPLE[lang.key]?.translation}</span>
              <div className="text-xs text-gray-400 dark:text-gray-500 italic">{EXAMPLE[lang.key]?.pronunciation}</div>
            </div>
            <span className="shrink-0 mt-0.5">🔊</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PronunciationMockup() {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-lg">
          🎙️
        </span>
        <div className="flex items-end gap-0.5 h-8">
          {[6, 14, 22, 12, 18, 8, 16, 10].map((h, i) => (
            <span key={i} className="w-1.5 rounded-full bg-purple-400 dark:bg-purple-500" style={{ height: `${h}px` }} />
          ))}
        </div>
        <span className="ml-auto w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs">
          ▶
        </span>
      </div>
      <div className="space-y-1.5">
        {LANGUAGES.map((lang) => (
          <div key={lang.key} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-gray-700 dark:text-gray-200">{lang.label}</span>
            <span>🔊</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HistoryMockup() {
  const rows = [
    "Good morning!",
    "How are you?",
    "Thank you!",
    "Where are you from?",
    "See you soon!",
  ];
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 dark:text-gray-500">
        <span>🔍</span> Search your history...
      </div>
      <div className="space-y-1.5">
        {rows.map((text) => (
          <div key={text} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-gray-700 dark:text-gray-200">{text}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">5 languages</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChatMockup() {
  return (
    <Card>
      <div className="space-y-2">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
          Hello! How can I help you learn today?
        </div>
        <div className="max-w-[80%] ml-auto rounded-2xl rounded-tr-sm bg-indigo-600 px-3 py-2 text-sm text-white">
          I want to learn Telugu greetings.
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
          Sure! Let's start with the basics — Namaskaram means "hello" 👋
        </div>
      </div>
    </Card>
  );
}

function MultilangMockup() {
  return (
    <Card>
      <img
        src={indiaCultureMap}
        alt="Map of India with Hindi, Telugu, Kannada, Tamil, and Malayalam labeled across their regions, alongside Indian cultural landmarks and heritage"
        className="w-full h-auto rounded-lg"
      />
    </Card>
  );
}

const PLAYGROUND_GAMES = [
  { emoji: "🎤", title: "Read Aloud" },
  { emoji: "🧠", title: "Language Quiz" },
  { emoji: "🧩", title: "Word Match" },
  { emoji: "⚡", title: "Speed Translate" },
  { emoji: "🎧", title: "Listen & Guess" },
  { emoji: "🔗", title: "Word Chain" },
  { emoji: "📝", title: "Guess the Sentence" },
];

function PlaygroundMockup() {
  return (
    <Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PLAYGROUND_GAMES.map((game) => (
          <div
            key={game.title}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-3 text-center"
          >
            <div className="text-xl">{game.emoji}</div>
            <div className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200">{game.title}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const MOCKUPS = {
  translation: TranslationMockup,
  pronunciation: PronunciationMockup,
  history: HistoryMockup,
  chat: ChatMockup,
  playground: PlaygroundMockup,
  multilang: MultilangMockup,
};

export default function MockupPreview({ type }) {
  const Component = MOCKUPS[type] ?? TranslationMockup;
  return <Component />;
}

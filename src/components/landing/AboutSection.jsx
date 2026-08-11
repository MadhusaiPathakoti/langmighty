import lmBadge from "../../media/lm-badge.png";

export default function AboutSection() {
  return (
    <section id="about" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/40">
      <div className="max-w-2xl mx-auto text-center">
        <img src={lmBadge} alt="LangMighty — every language, every voice, one world" className="w-40 h-40 mx-auto mb-6 rounded-full shadow-lg" />

        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          About{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            LangMighty
          </span>
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          LangMighty is a language-learning app built to make it easier to read, write, and speak Telugu, Hindi,
          Kannada, Malayalam, and Tamil — with AI-powered translation, native-voice pronunciation, an AI chat tutor,
          and practice games, all in one place.
        </p>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          ✦ Created by{" "}
          <a
            href="https://in.linkedin.com/in/madhusai-pathakoti"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Madhusai Pathakoti
          </a>
        </p>
      </div>
    </section>
  );
}

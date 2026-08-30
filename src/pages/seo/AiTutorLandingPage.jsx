import { LANGUAGES } from "langmighty-shared";
import useDocumentMeta from "../../hooks/useDocumentMeta.js";
import SeoPageShell, { SeoCta } from "./SeoPageShell.jsx";

export default function AiTutorLandingPage() {
  const title = "AI Language Tutor for Indian Languages | LangMighty";
  const description =
    "Chat with a free AI language tutor in English, Telugu, Hindi, Kannada, Malayalam, or Tamil — ask about grammar and vocabulary, or practice speaking real conversations out loud.";

  useDocumentMeta({ title, description, path: "/ai-language-tutor" });

  return (
    <SeoPageShell ctaTo="/?start=ai-chat" ctaLabel="Chat with the AI tutor →">
      <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
        AI Language Tutor for Indian Languages
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        LangMighty's AI tutor is a chat-based language partner for English, Telugu, Hindi, Kannada, Malayalam, and
        Tamil. Ask it to explain grammar, teach you vocabulary, or walk through example sentences — or switch to
        voice mode and practice a real spoken conversation, with the tutor replying out loud in whichever language
        you used.
      </p>

      <div className="mt-8">
        <SeoCta to="/?start=ai-chat">Start chatting with the AI tutor →</SeoCta>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          [
            "Ask anything, anytime",
            "Grammar rules, word meanings, or how to phrase something politely — the tutor answers in plain English.",
          ],
          [
            "Every answer includes pronunciation",
            "Native script, romanized transliteration, and meaning come with every example the tutor gives you.",
          ],
          [
            "Practice real conversations",
            "Roleplay everyday scenes — ordering food, asking directions, meeting someone new — instead of just drilling vocabulary.",
          ],
          [
            "Speak and listen with Voice mode",
            "Talk out loud in any of the six supported languages and get a spoken reply back, not just text.",
          ],
        ].map(([heading, body]) => (
          <div key={heading} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{heading}</h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-gray-600 dark:text-gray-400">
        Prefer a structured path instead of open-ended chat? LangMighty also has a guided learning roadmap for each
        language:{" "}
        {LANGUAGES.map((l, i) => (
          <span key={l.key}>
            <a href={`/learn-${l.key}-online`} className="text-indigo-600 dark:text-indigo-400 underline">
              {l.label}
            </a>
            {i < LANGUAGES.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
    </SeoPageShell>
  );
}

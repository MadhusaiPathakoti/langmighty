import { useEffect, useRef, useState } from "react";
import TranslateForm from "./components/TranslateForm.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import ExportTemplate from "./components/ExportTemplate.jsx";
import HistoryList from "./components/HistoryList.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useSpeechVoices } from "./hooks/useSpeechVoices.js";
import { exportNodeToPdf } from "./utils/pdfExport.js";

const HISTORY_KEY = "langlearn_history";
const THEME_KEY = "langlearn_theme";
const MAX_HISTORY = 5;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const [theme, setTheme] = useState(loadTheme);

  const voices = useSpeechVoices();
  const exportRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  async function handleSubmit() {
    const text = inputText.trim();
    if (!text) {
      setError("Please type an English sentence or phrase first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Translation failed. Please try again.");
        setResults(null);
        return;
      }

      setResults(data);
      setSubmittedText(text);

      const entry = { englishText: text, results: data, timestamp: Date.now() };
      const nextHistory = [entry, ...history.filter((h) => h.englishText !== text)].slice(0, MAX_HISTORY);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      setError("Could not reach the translation service. Check your connection and try again.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleHistorySelect(item) {
    setInputText(item.englishText);
    setSubmittedText(item.englishText);
    setResults(item.results);
    setError("");
  }

  async function handleExport() {
    if (!exportRef.current) return;
    const timestamp = Date.now();
    await exportNodeToPdf(exportRef.current, `translation_${timestamp}.pdf`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">LangLearn AI</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Translate English into Kannada, Malayalam &amp; Tamil — with pronunciation and voice.
            </p>
          </div>
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
        </header>

        <TranslateForm value={inputText} onChange={setInputText} onSubmit={handleSubmit} loading={loading} />

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            Translating...
          </div>
        )}

        {!loading && results && (
          <div className="mt-6">
            <ResultsTable results={results} voices={voices} />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400
                           dark:border-indigo-400 font-medium px-4 py-2 hover:bg-indigo-50
                           dark:hover:bg-indigo-950 transition-colors"
              >
                Export to PDF
              </button>
            </div>
          </div>
        )}

        <HistoryList history={history} onSelect={handleHistorySelect} />
      </div>

      {results && <ExportTemplate ref={exportRef} englishText={submittedText} results={results} />}
    </div>
  );
}

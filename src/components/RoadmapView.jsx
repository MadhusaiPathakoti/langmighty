import { useEffect, useRef, useState } from "react";
import { ROADMAP_LANGUAGES, ROADMAP_STAGES, ROADMAP_CONTENT } from "langmighty-shared";
import RoadmapExportTemplate from "./RoadmapExportTemplate.jsx";
import { exportNodeToPdf } from "../utils/pdfExport.js";

const PROGRESS_KEY = "langlearn_roadmap_progress";

// Keyed by language so switching languages doesn't clobber another language's
// checkmarks; each value is an array of completed stage ids for that language.
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function RoadmapView({ language, onSelectLanguage, onNavigatePdfStore }) {
  const exportRef = useRef(null);
  const langMeta = ROADMAP_LANGUAGES.find((l) => l.key === language);
  const content = ROADMAP_CONTENT[language];
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const completedStages = progress[language] || [];
  const completedCount = completedStages.filter((id) => ROADMAP_STAGES.some((s) => s.id === id)).length;
  const totalStages = ROADMAP_STAGES.length;
  const allStagesDone = completedCount === totalStages;

  function toggleStage(stageId) {
    setProgress((prev) => {
      const current = prev[language] || [];
      const next = current.includes(stageId)
        ? current.filter((id) => id !== stageId)
        : [...current, stageId];
      return { ...prev, [language]: next };
    });
  }

  async function handleDownload() {
    if (!exportRef.current) return;
    await exportNodeToPdf(exportRef.current, `${language}_roadmap_${Date.now()}.pdf`);
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {ROADMAP_LANGUAGES.map((lang) => {
              const langDone = (progress[lang.key] || []).filter((id) =>
                ROADMAP_STAGES.some((s) => s.id === id)
              ).length;
              return (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => onSelectLanguage(lang.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    lang.key === language
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {lang.label}
                  {langDone > 0 && (
                    <span
                      className={`ml-1.5 text-xs ${
                        lang.key === language ? "text-indigo-100" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {langDone}/{totalStages}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="self-start sm:self-auto rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400
                       dark:border-indigo-400 font-medium px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
          >
            Download PDF
          </button>
        </div>

        <h2 className="text-xl font-bold mb-1">
          Roadmap to Learn {langMeta.label}{" "}
          <span className="text-gray-400 font-normal">({langMeta.nativeName})</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          New here? Follow these steps in order — each stage builds on the one before it.
        </p>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700 dark:text-gray-300">Your progress</span>
            <span className="text-gray-500 dark:text-gray-400">
              {completedCount} / {totalStages} stages
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${(completedCount / totalStages) * 100}%` }}
            />
          </div>
        </div>

        {allStagesDone && (
          <div className="mb-8 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 You've completed the {langMeta.label} roadmap! Ready to go deeper?
            </p>
            {onNavigatePdfStore && (
              <button
                type="button"
                onClick={onNavigatePdfStore}
                className="rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-3 py-1.5 transition-colors"
              >
                Browse {langMeta.label} PDFs
              </button>
            )}
          </div>
        )}

        <div className="space-y-8">
          {ROADMAP_STAGES.map((stage) => {
            const stageContent = content[stage.id];
            const isDone = completedStages.includes(stage.id);
            return (
              <section key={stage.id} className={isDone ? "opacity-80" : ""}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center ${
                        isDone ? "bg-green-600 text-white" : "bg-indigo-600 text-white"
                      }`}
                    >
                      {isDone ? "✓" : stage.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stage.blurb}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    aria-pressed={isDone}
                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                      isDone
                        ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-xs leading-none ${
                        isDone ? "bg-green-600 text-white" : "border border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {isDone ? "✓" : ""}
                    </span>
                    {isDone ? "Completed" : "Mark complete"}
                  </button>
                </div>

                {stageContent.note && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 ml-10 mb-2">{stageContent.note}</p>
                )}

                <div className="ml-10 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
                  {stageContent.rows.map((row, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 bg-white dark:bg-gray-900 text-sm"
                    >
                      {row.speaker && (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 w-16">
                          {row.speaker}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.native}</span>
                      <span className="text-gray-500 dark:text-gray-400 italic">{row.roman}</span>
                      {row.meaning && <span className="text-gray-400 dark:text-gray-500">— {row.meaning}</span>}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <RoadmapExportTemplate ref={exportRef} language={language} langMeta={langMeta} />
    </div>
  );
}

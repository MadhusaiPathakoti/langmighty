import { useRef } from "react";
import { ROADMAP_LANGUAGES, ROADMAP_STAGES, ROADMAP_CONTENT } from "../roadmapData.js";
import RoadmapExportTemplate from "./RoadmapExportTemplate.jsx";
import { exportNodeToPdf } from "../utils/pdfExport.js";

export default function RoadmapView({ language, onSelectLanguage }) {
  const exportRef = useRef(null);
  const langMeta = ROADMAP_LANGUAGES.find((l) => l.key === language);
  const content = ROADMAP_CONTENT[language];

  async function handleDownload() {
    if (!exportRef.current) return;
    await exportNodeToPdf(exportRef.current, `${language}_roadmap_${Date.now()}.pdf`);
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex gap-2">
            {ROADMAP_LANGUAGES.map((lang) => (
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
              </button>
            ))}
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
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          New here? Follow these steps in order — each stage builds on the one before it.
        </p>

        <div className="space-y-8">
          {ROADMAP_STAGES.map((stage) => {
            const stageContent = content[stage.id];
            return (
              <section key={stage.id}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                    {stage.number}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stage.blurb}</p>
                  </div>
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

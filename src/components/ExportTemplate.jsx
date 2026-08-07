import { forwardRef } from "react";
import { LANGUAGES, getInputLanguage } from "../languages.js";

const ExportTemplate = forwardRef(function ExportTemplate({ conversation }, ref) {
  const doneTurns = conversation.filter((t) => t.status === "done");

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "-10000px",
        left: 0,
        width: "700px",
        padding: "32px",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>LangMighty</h1>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>Conversation transcript</p>

      {doneTurns.map((turn, i) => {
        const sourceLabel = getInputLanguage(turn.sourceLanguage).label;
        return (
        <div key={turn.id} style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "14px", marginBottom: "10px" }}>
            <strong>{i + 1}. {sourceLabel}:</strong> {turn.sourceText ?? turn.englishText}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Language", "Translation", "Pronunciation (Roman)"].map((h) => (
                  <th
                    key={h}
                    style={{
                      border: "1px solid #d1d5db",
                      background: "#f3f4f6",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LANGUAGES.map(({ key, label }) => {
                const row = turn.results[key];
                if (!row) return null;
                return (
                  <tr key={key}>
                    <td style={{ border: "1px solid #d1d5db", padding: "8px", fontWeight: 600 }}>{label}</td>
                    <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>{row.translation}</td>
                    <td style={{ border: "1px solid #d1d5db", padding: "8px", fontStyle: "italic" }}>
                      {row.pronunciation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })}
    </div>
  );
});

export default ExportTemplate;

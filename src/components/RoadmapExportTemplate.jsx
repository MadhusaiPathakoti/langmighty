import { forwardRef } from "react";
import { ROADMAP_STAGES, ROADMAP_CONTENT } from "../roadmapData.js";

const RoadmapExportTemplate = forwardRef(function RoadmapExportTemplate({ language, langMeta }, ref) {
  const content = ROADMAP_CONTENT[language];

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
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Linguist.ai</h1>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
        Roadmap to Learn {langMeta.label} ({langMeta.nativeName})
      </p>
      <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "24px" }}>
        Follow these steps in order — each stage builds on the one before it.
      </p>

      {ROADMAP_STAGES.map((stage) => {
        const stageContent = content[stage.id];
        return (
          <div key={stage.id} style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "2px" }}>
              {stage.number}. {stage.title}
            </h2>
            <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{stage.blurb}</p>
            {stageContent.note && (
              <p style={{ fontSize: "11px", fontStyle: "italic", color: "#6b7280", marginBottom: "6px" }}>
                {stageContent.note}
              </p>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                {stageContent.rows.map((row, i) => (
                  <tr key={i}>
                    {row.speaker && (
                      <td style={{ border: "1px solid #e5e7eb", padding: "6px", fontWeight: 600, width: "70px" }}>
                        {row.speaker}
                      </td>
                    )}
                    <td style={{ border: "1px solid #e5e7eb", padding: "6px", fontWeight: 600 }}>{row.native}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "6px", fontStyle: "italic" }}>{row.roman}</td>
                    {row.meaning && (
                      <td style={{ border: "1px solid #e5e7eb", padding: "6px", color: "#6b7280" }}>{row.meaning}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
});

export default RoadmapExportTemplate;

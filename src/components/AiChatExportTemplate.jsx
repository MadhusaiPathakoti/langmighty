import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  h1: (props) => <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "12px 0 6px" }} {...props} />,
  h2: (props) => <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "12px 0 6px" }} {...props} />,
  h3: (props) => <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "10px 0 4px" }} {...props} />,
  p: (props) => <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "0 0 8px" }} {...props} />,
  ul: (props) => <ul style={{ fontSize: "13px", margin: "0 0 8px", paddingLeft: "20px" }} {...props} />,
  ol: (props) => <ol style={{ fontSize: "13px", margin: "0 0 8px", paddingLeft: "20px" }} {...props} />,
  li: (props) => <li style={{ marginBottom: "2px" }} {...props} />,
  strong: (props) => <strong style={{ fontWeight: 700 }} {...props} />,
  code: (props) => (
    <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: "3px", fontSize: "12px" }} {...props} />
  ),
  hr: () => <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />,
  table: (props) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", margin: "8px 0 14px" }} {...props} />
  ),
  th: (props) => (
    <th
      style={{ border: "1px solid #d1d5db", background: "#f3f4f6", padding: "6px 8px", textAlign: "left" }}
      {...props}
    />
  ),
  td: (props) => <td style={{ border: "1px solid #d1d5db", padding: "6px 8px" }} {...props} />,
};

const AiChatExportTemplate = forwardRef(function AiChatExportTemplate({ messages }, ref) {
  const doneMessages = messages.filter((m) => m.status === "done" && m.content?.trim());

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
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>AI Chat transcript</p>

      {doneMessages.map((message, i) =>
        message.role === "user" ? (
          <p
            key={message.id}
            style={{ fontSize: "14px", marginTop: i === 0 ? 0 : "20px", marginBottom: "8px" }}
          >
            <strong>Q:</strong> {message.content}
          </p>
        ) : (
          <div key={message.id}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )
      )}
    </div>
  );
});

export default AiChatExportTemplate;

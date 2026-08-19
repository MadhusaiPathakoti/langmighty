import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  h1: (props) => <h3 className="text-base font-bold mt-3 mb-1.5" {...props} />,
  h2: (props) => <h3 className="text-base font-bold mt-3 mb-1.5" {...props} />,
  h3: (props) => <h4 className="text-sm font-bold mt-3 mb-1" {...props} />,
  p: (props) => <p className="mb-2 leading-relaxed" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 mb-2 space-y-0.5" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 mb-2 space-y-0.5" {...props} />,
  strong: (props) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
  code: (props) => (
    <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-[0.85em]" {...props} />
  ),
  hr: () => <hr className="my-3 border-gray-200 dark:border-gray-700" />,
  table: (props) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
  th: (props) => (
    <th className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  td: (props) => <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800" {...props} />,
};

export default function AiChatMessage({ message, onDelete, onRegenerate, onEdit, disableActions }) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function startEdit() {
    setDraft(message.content);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setIsEditing(false);
    onEdit?.(message.id, trimmed);
  }

  if (isUser) {
    if (isEditing) {
      return (
        <div className="flex justify-end group">
          <div className="min-w-0 w-full max-w-[80%] sm:max-w-md rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  cancelEdit();
                }
              }}
              rows={3}
              className="w-full resize-none rounded-lg bg-indigo-700 text-white placeholder:text-indigo-200 px-2.5 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onDelete?.(message.id)}
                className="text-xs font-medium text-indigo-200 hover:text-red-200 hover:underline"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs font-medium text-indigo-100 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={!draft.trim() || disableActions}
                  className="text-xs font-semibold bg-white text-indigo-700 rounded-full px-3 py-1
                             hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save & resend
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-end items-center gap-2 group">
        <button
          type="button"
          onClick={startEdit}
          disabled={disableActions}
          className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit this message"
          aria-label="Edit this message"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(message.id)}
          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors"
          title="Delete this message"
          aria-label="Delete this message"
        >
          🗑
        </button>
        <div className="min-w-0 max-w-[80%] rounded-2xl bg-indigo-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start group">
      <div className="min-w-0 max-w-full w-full sm:max-w-[90%] rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-800 dark:text-gray-100">
        {message.status === "loading" && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            Thinking...
          </div>
        )}

        {message.status === "error" && (
          <p className="text-red-600 dark:text-red-400">{message.error}</p>
        )}

        {message.status === "done" && (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
            <button
              type="button"
              onClick={() => onRegenerate?.(message.id)}
              disabled={disableActions}
              title="Ask again for a different answer"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↻ Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

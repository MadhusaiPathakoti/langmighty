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

export default function AiChatMessage({ message, onDelete }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end items-center gap-2 group">
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

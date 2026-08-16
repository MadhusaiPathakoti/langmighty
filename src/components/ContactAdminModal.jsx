import { useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../lib/apiClient.js";
import { supabase } from "../lib/supabaseClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

const ATTACHMENTS_BUCKET = "support-attachments";
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = "image/*,.pdf,.doc,.docx,.txt";

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 " +
  "text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function ContactAdminModal({ open, onClose }) {
  const { userEmail, getAuthHeaders } = useAuthGate();

  const [email, setEmail] = useState(userEmail || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  function resetAndClose() {
    setEmail(userEmail || "");
    setSubject("");
    setMessage("");
    setFiles([]);
    setFileError(null);
    setError(null);
    setDone(false);
    onClose?.();
  }

  function handleFilesChange(e) {
    const chosen = Array.from(e.target.files || []);
    setFileError(null);

    if (chosen.length > MAX_ATTACHMENTS) {
      setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }
    const tooBig = chosen.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setFileError(`"${tooBig.name}" is over 5MB. Please attach smaller files.`);
      return;
    }
    setFiles(chosen);
  }

  async function uploadAttachment(file) {
    const authHeaders = await getAuthHeaders();
    const urlRes = await apiFetch("/api/support/create-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ fileName: file.name }),
    });
    const urlData = await urlRes.json();
    if (!urlRes.ok) throw new Error(urlData.error || "Could not prepare the attachment upload.");

    const { error: uploadErr } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .uploadToSignedUrl(urlData.path, urlData.token, file);
    if (uploadErr) throw uploadErr;

    return { path: urlData.path, name: file.name, contentType: file.type, size: file.size };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const attachments = [];
      for (const file of files) {
        attachments.push(await uploadAttachment(file));
      }

      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/support/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ subject, message, email, attachments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit your report.");

      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={resetAndClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Admin</h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-1 -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {done ? (
          <div>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-950/50 rounded-lg px-3 py-2">
              Thanks — your report was sent. We'll get back to you at {email}.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Ran into a bug or have feedback? Let us know and attach a screenshot if it helps.
            </p>

            <input
              type="email"
              placeholder="Your email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Subject"
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              required
            />
            <textarea
              placeholder="Describe the issue..."
              className={inputClass}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              required
            />

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Attach screenshots or documents (optional, up to {MAX_ATTACHMENTS}, 5MB each)
              </label>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleFilesChange}
                className="w-full text-sm text-gray-600 dark:text-gray-300"
              />
              {fileError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fileError}</p>}
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 text-sm transition-colors"
            >
              {submitting ? "Sending..." : "Send report"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

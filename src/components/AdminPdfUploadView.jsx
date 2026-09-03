import { useState } from "react";
import { INPUT_LANGUAGES } from "langmighty-shared";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import { supabase } from "../lib/supabaseClient.js";
import AdminOverviewView from "./AdminOverviewView.jsx";
import AdminSubscriptionsView from "./AdminSubscriptionsView.jsx";
import AdminUsersView from "./AdminUsersView.jsx";
import ManagePdfsView from "./ManagePdfsView.jsx";
import PdfPreviewPagePicker, { evenSpread } from "./PdfPreviewPagePicker.jsx";
import SupportTicketsView from "./SupportTicketsView.jsx";

const ORIGINALS_BUCKET = "pdf-store-originals";

function languageLabel(key) {
  return INPUT_LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

export default function AdminPdfUploadView({ onBack, onUploaded }) {
  const { getAuthHeaders } = useAuthGate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fromLang, setFromLang] = useState(INPUT_LANGUAGES[0]?.key ?? "");
  const [toLang, setToLang] = useState(INPUT_LANGUAGES[1]?.key ?? "");
  const [priceRupees, setPriceRupees] = useState("99");
  const [originalPriceRupees, setOriginalPriceRupees] = useState("");
  const [defaultPreviewCount, setDefaultPreviewCount] = useState("3");
  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const [reviewing, setReviewing] = useState(false);
  // Set once the original file is uploaded and its real page count is known
  // — { pageCount, originalStoragePath } — which switches the flow into the
  // page-picker step instead of finalizing immediately.
  const [pickingPages, setPickingPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  // "overview" | "users" | "subscriptions" | "upload" | "manage" | "support"
  const [tab, setTab] = useState("overview");

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!file || file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    if (!priceRupees || Number(priceRupees) <= 0) {
      setError("Please enter a price.");
      return;
    }
    if (originalPriceRupees && Number(originalPriceRupees) <= Number(priceRupees)) {
      setError("Original price must be higher than the price.");
      return;
    }
    setError(null);
    setReviewing(true);
  }

  async function performUpload() {
    setReviewing(false);
    setSubmitting(true);
    setError(null);
    setStatus("Preparing upload…");

    try {
      const authHeaders = await getAuthHeaders();

      const urlRes = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "create-upload-url", fileName: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || "Could not prepare the upload.");

      setStatus("Uploading file…");
      const { error: uploadErr } = await supabase.storage
        .from(ORIGINALS_BUCKET)
        .uploadToSignedUrl(urlData.path, urlData.token, file);
      if (uploadErr) throw uploadErr;

      setStatus("Reading page count…");
      const pageCountRes = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "get-page-count", originalStoragePath: urlData.path }),
      });
      const pageCountData = await pageCountRes.json();
      if (!pageCountRes.ok) throw new Error(pageCountData.error || "Could not read the PDF's page count.");

      setStatus(null);
      setPickingPages({ pageCount: pageCountData.pageCount, originalStoragePath: urlData.path });
      setSelectedPages(evenSpread(pageCountData.pageCount, Number(defaultPreviewCount) || 3));
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmPreviewPages() {
    if (selectedPages.length === 0) {
      setError("Select at least one page for the preview.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setStatus("Finalizing…");

    try {
      const authHeaders = await getAuthHeaders();
      const finalizeRes = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "finalize",
          title,
          description,
          fromLang,
          toLang,
          pricePaise: Math.round(Number(priceRupees) * 100),
          originalPricePaise: originalPriceRupees ? Math.round(Number(originalPriceRupees) * 100) : null,
          previewPageIndices: selectedPages,
          originalStoragePath: pickingPages.originalStoragePath,
        }),
      });
      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalizeData.error || "Could not finalize this PDF.");

      setStatus(null);
      setPickingPages(null);
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Could not finalize this PDF.");
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin</h1>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
          >
            Back to store
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto flex-nowrap">
          <button
            type="button"
            onClick={() => setTab("overview")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "users"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setTab("subscriptions")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "subscriptions"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Subscriptions
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "upload"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Upload New
          </button>
          <button
            type="button"
            onClick={() => setTab("manage")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "manage"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Manage Existing
          </button>
          <button
            type="button"
            onClick={() => setTab("support")}
            disabled={submitting}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              tab === "support"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Support Tickets
          </button>
        </div>

        {tab === "overview" && <AdminOverviewView />}
        {tab === "users" && <AdminUsersView />}
        {tab === "subscriptions" && <AdminSubscriptionsView />}
        {tab === "manage" && <ManagePdfsView />}
        {tab === "support" && <SupportTicketsView />}

        {tab === "upload" && (
        <form onSubmit={handleFormSubmit} className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              disabled={submitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">From language</label>
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              >
                {INPUT_LANGUAGES.map((lang) => (
                  <option key={lang.key} value={lang.key}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">To language</label>
              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              >
                {INPUT_LANGUAGES.map((lang) => (
                  <option key={lang.key} value={lang.key}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Price (₹)</label>
              <input
                type="number"
                min="1"
                required
                disabled={submitting}
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                Original price (₹) — optional
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 399"
                disabled={submitting}
                value={originalPriceRupees}
                onChange={(e) => setOriginalPriceRupees(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Default preview page count
            </label>
            <input
              type="number"
              min="1"
              required
              disabled={submitting}
              value={defaultPreviewCount}
              onChange={(e) => setDefaultPreviewCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Just a starting point — you'll pick the exact pages after the file uploads.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              required
              disabled={submitting}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 dark:text-gray-300 disabled:opacity-60"
            />
          </div>

          {status && <p className="text-sm text-gray-500 dark:text-gray-400">{status}</p>}
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
          >
            {submitting ? "Uploading…" : "Continue"}
          </button>
        </form>
        )}
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Review before uploading</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Double-check everything below — this is exactly what will be listed.
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-gray-400">Title</dt>
                <dd className="text-gray-900 dark:text-gray-100 text-right">{title}</dd>
              </div>
              {description && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Description</dt>
                  <dd className="text-gray-900 dark:text-gray-100 text-right">{description}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-gray-400">Languages</dt>
                <dd className="text-gray-900 dark:text-gray-100 text-right">
                  {languageLabel(fromLang)} → {languageLabel(toLang)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-gray-400">Price</dt>
                <dd className="text-gray-900 dark:text-gray-100 text-right">
                  {originalPriceRupees && (
                    <span className="line-through text-gray-400 mr-1.5">₹{originalPriceRupees}</span>
                  )}
                  ₹{priceRupees}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-gray-400">File</dt>
                <dd className="text-gray-900 dark:text-gray-100 text-right truncate max-w-[60%]">{file?.name}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              You'll choose exactly which pages appear in the free preview once the file finishes uploading.
            </p>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setReviewing(false)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Go back &amp; edit
              </button>
              <button
                type="button"
                onClick={performUpload}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {pickingPages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Select preview pages</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              File uploaded — pick exactly which pages buyers see for free before you publish this listing.
            </p>

            <div className="mt-4">
              <PdfPreviewPagePicker
                pageCount={pickingPages.pageCount}
                selected={selectedPages}
                onChange={setSelectedPages}
                disabled={submitting}
              />
            </div>

            {status && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{status}</p>}
            {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={confirmPreviewPages}
              className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              {submitting ? "Publishing…" : "Publish with these pages"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

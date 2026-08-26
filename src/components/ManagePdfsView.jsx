import { useEffect, useState } from "react";
import { INPUT_LANGUAGES } from "langmighty-shared";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import PdfPreviewPagePicker from "./PdfPreviewPagePicker.jsx";

function languageLabel(key) {
  return INPUT_LANGUAGES.find((l) => l.key === key)?.label ?? key;
}

function formatPrice(pricePaise) {
  return `₹${(pricePaise / 100).toFixed(0)}`;
}

function discountPercent(pricePaise, originalPricePaise) {
  if (!originalPricePaise || originalPricePaise <= pricePaise) return null;
  return Math.round((1 - pricePaise / originalPricePaise) * 100);
}

export default function ManagePdfsView() {
  const { getAuthHeaders } = useAuthGate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busyId, setBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editPriceRupees, setEditPriceRupees] = useState("");
  const [editOriginalPriceRupees, setEditOriginalPriceRupees] = useState("");
  const [editingPreviewId, setEditingPreviewId] = useState(null);
  const [editPreviewPages, setEditPreviewPages] = useState([]);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the PDF list.");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Could not load the PDF list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setRowError(id, message) {
    setRowErrors((prev) => ({ ...prev, [id]: message }));
  }

  function startEditPrice(item) {
    setEditingId(item.id);
    setEditPriceRupees(String(item.pricePaise / 100));
    setEditOriginalPriceRupees(item.originalPricePaise ? String(item.originalPricePaise / 100) : "");
    setRowError(item.id, null);
  }

  async function saveEditedPrice(item) {
    const rupees = Number(editPriceRupees);
    if (!rupees || rupees <= 0) {
      setRowError(item.id, "Enter a valid price.");
      return;
    }
    const originalRupees = editOriginalPriceRupees ? Number(editOriginalPriceRupees) : null;
    if (originalRupees && originalRupees <= rupees) {
      setRowError(item.id, "Original price must be higher than the price.");
      return;
    }
    setBusyId(item.id);
    setRowError(item.id, null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "update-price",
          pdfId: item.id,
          pricePaise: Math.round(rupees * 100),
          originalPricePaise: originalRupees ? Math.round(originalRupees * 100) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the price.");
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                pricePaise: Math.round(rupees * 100),
                originalPricePaise: originalRupees ? Math.round(originalRupees * 100) : null,
              }
            : it
        )
      );
      setEditingId(null);
    } catch (err) {
      setRowError(item.id, err.message || "Could not update the price.");
    } finally {
      setBusyId(null);
    }
  }

  function startEditPreview(item) {
    setEditingPreviewId(item.id);
    setEditPreviewPages(item.previewPageIndices || []);
    setRowError(item.id, null);
  }

  async function saveEditedPreview(item) {
    if (editPreviewPages.length === 0) {
      setRowError(item.id, "Select at least one page.");
      return;
    }
    setBusyId(item.id);
    setRowError(item.id, null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "regenerate-preview", pdfId: item.id, previewPageIndices: editPreviewPages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the preview.");
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, previewPageCount: data.previewPageCount, previewPageIndices: data.previewPageIndices }
            : it
        )
      );
      setEditingPreviewId(null);
    } catch (err) {
      setRowError(item.id, err.message || "Could not update the preview.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(item) {
    setBusyId(item.id);
    setRowError(item.id, null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "set-active", pdfId: item.id, isActive: !item.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update this PDF.");
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, isActive: !it.isActive } : it)));
    } catch (err) {
      setRowError(item.id, err.message || "Could not update this PDF.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    setRowError(item.id, null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "delete", pdfId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete this PDF.");
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      setRowError(item.id, err.message || "Could not delete this PDF.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>;

  if (error) {
    return <p className="text-sm text-red-500 dark:text-red-400 text-center py-6">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">No PDFs uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {languageLabel(item.fromLang)} → {languageLabel(item.toLang)} ·{" "}
                {item.purchaseCount} purchase{item.purchaseCount === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                item.isActive
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-3">
            {editingId === item.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    autoFocus
                    value={editPriceRupees}
                    onChange={(e) => setEditPriceRupees(e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Original (₹, optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 399"
                    value={editOriginalPriceRupees}
                    onChange={(e) => setEditOriginalPriceRupees(e.target.value)}
                    className="w-28 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => saveEditedPrice(item)}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 text-sm transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {item.originalPricePaise > item.pricePaise && (
                  <span className="line-through text-gray-400 dark:text-gray-500 text-sm">
                    {formatPrice(item.originalPricePaise)}
                  </span>
                )}
                <span className="font-medium text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatPrice(item.pricePaise)}
                </span>
                {discountPercent(item.pricePaise, item.originalPricePaise) && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {discountPercent(item.pricePaise, item.originalPricePaise)}% off
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => startEditPrice(item)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Edit price
                </button>
              </div>
            )}
          </div>

          {item.pageCount != null && (
            <div className="mt-3">
              {editingPreviewId === item.id ? (
                <div>
                  <PdfPreviewPagePicker
                    pageCount={item.pageCount}
                    selected={editPreviewPages}
                    onChange={setEditPreviewPages}
                    disabled={busyId === item.id}
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => saveEditedPreview(item)}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 text-sm transition-colors"
                    >
                      Save preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreviewId(null)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Preview: {item.previewPageCount} of {item.pageCount} pages ·{" "}
                  <button
                    type="button"
                    onClick={() => startEditPreview(item)}
                    className="hover:underline text-gray-600 dark:text-gray-300 font-medium"
                  >
                    Edit preview pages
                  </button>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => toggleActive(item)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {item.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => deleteItem(item)}
              className="flex-1 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60 transition-colors"
            >
              Delete
            </button>
          </div>

          {rowErrors[item.id] && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">{rowErrors[item.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

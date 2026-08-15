import { useEffect, useState } from "react";
import { INPUT_LANGUAGES } from "langmighty-shared";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";
import AdminPdfUploadView from "./AdminPdfUploadView.jsx";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PdfStoreView() {
  const { isSignedIn, getAuthHeaders, openAuthModal } = useAuthGate();

  const [showAdmin, setShowAdmin] = useState(false);
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [purchasedIds, setPurchasedIds] = useState(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  const [buyingId, setBuyingId] = useState(null);
  const [revealed, setRevealed] = useState(null); // { title, password }
  const [downloadPromptId, setDownloadPromptId] = useState(null);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [downloadError, setDownloadError] = useState(null);
  const [viewedPasswords, setViewedPasswords] = useState({}); // pdfId -> password
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);

    apiFetch(`/api/pdf-store/list?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.items || []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the PDF store. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fromFilter, toFilter, catalogRefreshKey]);

  async function refreshPurchases() {
    if (!isSignedIn) {
      setPurchasedIds(new Set());
      setIsAdmin(false);
      return;
    }
    const authHeaders = await getAuthHeaders();
    const res = await apiFetch("/api/pdf-store/my-purchases", { headers: authHeaders });
    if (!res.ok) return;
    const data = await res.json();
    setPurchasedIds(new Set((data.purchases || []).map((p) => p.pdfId)));
    setIsAdmin(Boolean(data.isAdmin));
  }

  useEffect(() => {
    refreshPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  async function handleBuy(item) {
    if (!isSignedIn) {
      openAuthModal("login");
      return;
    }
    setError(null);
    setBuyingId(item.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ pdfId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment.");
        setBuyingId(null);
        return;
      }
      if (data.alreadyPurchased) {
        await refreshPurchases();
        setBuyingId(null);
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setError("Could not load the payment widget. Check your connection and try again.");
        setBuyingId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amountPaise,
        currency: data.currency,
        name: "LangMighty",
        description: data.title,
        handler: (response) => handleVerify(item, response),
        modal: { ondismiss: () => setBuyingId(null) },
      });
      rzp.open();
    } catch {
      setError("Could not start payment. Please try again.");
      setBuyingId(null);
    }
  }

  async function handleVerify(item, response) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          pdfId: item.id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment verification failed. If you were charged, please contact support.");
        return;
      }
      setRevealed({ title: item.title, password: data.password });
      await refreshPurchases();
    } catch {
      setError("Payment succeeded but we couldn't confirm it. Please refresh and check My Purchases.");
    } finally {
      setBuyingId(null);
    }
  }

  async function handleViewPassword(item) {
    const authHeaders = await getAuthHeaders();
    const res = await apiFetch("/api/pdf-store/view-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ pdfId: item.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setViewedPasswords((prev) => ({ ...prev, [item.id]: data.password }));
    } else {
      setError(data.error || "Could not retrieve your password.");
    }
  }

  async function handleDownloadSubmit(item) {
    setDownloadError(null);
    const authHeaders = await getAuthHeaders();
    const res = await apiFetch("/api/pdf-store/download", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ pdfId: item.id, password: downloadPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDownloadError(data.error || "Could not start the download.");
      return;
    }
    window.location.href = data.url;
    setDownloadPromptId(null);
    setDownloadPassword("");
  }

  if (showAdmin) {
    return (
      <AdminPdfUploadView
        onBack={() => {
          setShowAdmin(false);
          setCatalogRefreshKey((k) => k + 1);
        }}
        onUploaded={() => {
          setShowAdmin(false);
          setCatalogRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">PDF Store</h1>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Upload a PDF
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="pdf-store-from" className="text-gray-500 dark:text-gray-400">
              From:
            </label>
            <select
              id="pdf-store-from"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
            >
              <option value="">All languages</option>
              {INPUT_LANGUAGES.map((lang) => (
                <option key={lang.key} value={lang.key}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="pdf-store-to" className="text-gray-500 dark:text-gray-400">
              To:
            </label>
            <select
              id="pdf-store-to"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5"
            >
              <option value="">All languages</option>
              {INPUT_LANGUAGES.map((lang) => (
                <option key={lang.key} value={lang.key}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading catalog…</p>
        ) : items.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 px-6 py-14 text-center">
            <p className="text-gray-500 dark:text-gray-400">No PDFs match this filter yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const purchased = purchasedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3"
                >
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {languageLabel(item.fromLang)} → {languageLabel(item.toLang)}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-baseline gap-1.5">
                      {item.originalPricePaise > item.pricePaise && (
                        <span className="line-through text-gray-400 dark:text-gray-500 text-xs">
                          {formatPrice(item.originalPricePaise)}
                        </span>
                      )}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {formatPrice(item.pricePaise)}
                      </span>
                      {discountPercent(item.pricePaise, item.originalPricePaise) && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {discountPercent(item.pricePaise, item.originalPricePaise)}% off
                        </span>
                      )}
                    </span>
                    <a
                      href={item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      Preview ({item.previewPageCount} pages)
                    </a>
                  </div>

                  {!purchased ? (
                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={buyingId === item.id}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
                    >
                      {buyingId === item.id
                        ? "Processing…"
                        : isSignedIn
                          ? `Buy for ${formatPrice(item.pricePaise)}`
                          : "Sign in to buy"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDownloadPromptId(item.id);
                            setDownloadError(null);
                            setDownloadPassword("");
                          }}
                          className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewPassword(item)}
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          View Password
                        </button>
                      </div>

                      {viewedPasswords[item.id] && (
                        <p className="text-sm text-center font-mono tracking-wider bg-gray-100 dark:bg-gray-800 rounded-lg py-1.5">
                          {viewedPasswords[item.id]}
                        </p>
                      )}

                      {downloadPromptId === item.id && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <input
                            type="text"
                            value={downloadPassword}
                            onChange={(e) => setDownloadPassword(e.target.value)}
                            placeholder="Enter your PDF password"
                            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                          />
                          {downloadError && <p className="text-xs text-red-500 dark:text-red-400">{downloadError}</p>}
                          <button
                            type="button"
                            onClick={() => handleDownloadSubmit(item)}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
                          >
                            Unlock & Download
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {revealed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 text-center">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Purchase complete!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Save this password — you'll need it every time you download "{revealed.title}", and to open the
              downloaded file itself. It can't be changed, but you can always view it again from here.
            </p>
            <p className="mt-4 text-lg font-mono tracking-wider bg-gray-100 dark:bg-gray-800 rounded-lg py-2">
              {revealed.password}
            </p>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

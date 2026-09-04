import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export default function AdminAmbassadorsView() {
  const { getAuthHeaders } = useAuthGate();

  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [email, setEmail] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  async function loadAmbassadors() {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load ambassadors.");
      setAmbassadors(data.ambassadors || []);
    } catch (err) {
      setError(err.message || "Could not load ambassadors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAmbassadors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "create", email: email.trim(), customCode: customCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create this ambassador.");
      setEmail("");
      setCustomCode("");
      await loadAmbassadors();
    } catch (err) {
      setError(err.message || "Could not create this ambassador.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(ambassador) {
    const nextStatus = ambassador.status === "active" ? "disabled" : "active";
    setBusyId(ambassador.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "set-status", ambassadorId: ambassador.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update this ambassador.");
      setAmbassadors((prev) => prev.map((a) => (a.id === ambassador.id ? { ...a, status: nextStatus } : a)));
    } catch (err) {
      setError(err.message || "Could not update this ambassador.");
    } finally {
      setBusyId(null);
    }
  }

  async function copyLink(ambassador) {
    const link = `${window.location.origin}/?ref=${ambassador.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(ambassador.id);
      setTimeout(() => setCopiedId((id) => (id === ambassador.id ? null : id)), 1500);
    } catch {
      setError("Could not copy the link.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="max-w-lg space-y-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create ambassador</h2>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email of an existing signed-up user</label>
          <input
            type="email"
            required
            disabled={creating}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Custom referral code (optional)</label>
          <input
            type="text"
            placeholder="e.g. PRIYA — leave blank to auto-generate"
            disabled={creating}
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
        >
          {creating ? "Creating…" : "Create ambassador"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>
      ) : ambassadors.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">No ambassadors yet.</p>
      ) : (
        <div className="space-y-3">
          {ambassadors.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{a.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Since {formatDate(a.createdAt)} · {a.referralCount} signup{a.referralCount === 1 ? "" : "s"} ·{" "}
                    {a.conversionCount} paying subscriber{a.conversionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      a.status === "active"
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {a.status === "active" ? "Active" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => toggleStatus(a)}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    {a.status === "active" ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate text-xs bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-300">
                  {window.location.origin}/?ref={a.referralCode}
                </code>
                <button
                  type="button"
                  onClick={() => copyLink(a)}
                  className="flex-shrink-0 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {copiedId === a.id ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

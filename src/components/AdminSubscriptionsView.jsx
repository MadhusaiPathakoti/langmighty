import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

const STATUS_BADGE = {
  active: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  created: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  cancelled: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  halted: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

export default function AdminSubscriptionsView() {
  const { getAuthHeaders } = useAuthGate();
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadSubscriptions() {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list-subscriptions", status: statusFilter || undefined, tier: tierFilter || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load subscriptions.");
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err.message || "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, tierFilter]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="created">Created</option>
          <option value="cancelled">Cancelled</option>
          <option value="halted">Halted</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2.5 py-1.5 text-sm"
        >
          <option value="">All tiers</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>
      ) : subscriptions.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">No subscriptions match this filter.</p>
      ) : (
        subscriptions.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s.tier === "pro" ? "Mighty Pro" : "Mighty Premium"}
                {s.isComp && " (comp)"} · since {formatDate(s.createdAt)}
                {s.currentPeriodEnd && ` · renews ${formatDate(s.currentPeriodEnd)}`}
              </p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[s.status] || STATUS_BADGE.created}`}>
              {s.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

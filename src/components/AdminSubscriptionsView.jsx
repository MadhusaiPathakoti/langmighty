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

const TIER_LABELS = { pro: "Mighty Pro", premium: "Mighty Premium" };

// Razorpay Plans can't have their amount edited in place — saving here
// creates a brand-new Plan at the new price and switches future
// subscriptions over to it (see api/pdf-store/admin.js's
// update-subscription-price). Existing subscribers keep billing at their
// original price until they cancel and resubscribe, same as Razorpay itself
// works for a live subscription.
function PlanPricingEditor() {
  const { getAuthHeaders } = useAuthGate();
  const [prices, setPrices] = useState(null); // { pro: paise, premium: paise } | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTier, setEditingTier] = useState(null); // "pro" | "premium" | null
  const [draftRupees, setDraftRupees] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadPrices() {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list-plan-prices" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load prices.");
      setPrices(data.prices);
    } catch (err) {
      setError(err.message || "Could not load prices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEditing(tier) {
    setEditingTier(tier);
    setDraftRupees(String(prices[tier] / 100));
    setError(null);
  }

  async function saveTier(tier) {
    const rupees = Number(draftRupees);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError("Enter a valid price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "update-subscription-price", tier, pricePaise: Math.round(rupees * 100) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the price.");
      setEditingTier(null);
      await loadPrices();
    } catch (err) {
      setError(err.message || "Could not update the price.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Plan pricing</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Only applies to new subscriptions — anyone already subscribed keeps their original price until they cancel
          and resubscribe.
        </p>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading || !prices ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-2">
          {["pro", "premium"].map((tier) => (
            <div key={tier} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-200">{TIER_LABELS[tier]}</span>
              {editingTier === tier ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    autoFocus
                    value={draftRupees}
                    onChange={(e) => setDraftRupees(e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveTier(tier)}
                    className="text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1.5 disabled:opacity-60 transition-colors"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingTier(null)}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ₹{prices[tier] / 100}/mo
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditing(tier)}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Edit price
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <PlanPricingEditor />

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

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

function formatPrice(pricePaise) {
  return `₹${(pricePaise / 100).toLocaleString("en-IN")}`;
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewView() {
  const { getAuthHeaders } = useAuthGate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const authHeaders = await getAuthHeaders();
        const res = await apiFetch("/api/pdf-store/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ action: "overview-stats" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load overview stats.");
        setStats(data);
      } catch (err) {
        setError(err.message || "Could not load overview stats.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>;
  if (error) return <p className="text-sm text-red-500 dark:text-red-400 text-center py-6">{error}</p>;
  if (!stats) return null;

  const totalSubscribers = stats.subscriberCounts.pro + stats.subscriberCounts.premium;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="MRR" value={formatPrice(stats.mrrPaise)} sub={`${totalSubscribers} active subscriber${totalSubscribers === 1 ? "" : "s"}`} />
      <StatCard label="Mighty Pro" value={stats.subscriberCounts.pro} sub="active subscribers" />
      <StatCard label="Mighty Premium" value={stats.subscriberCounts.premium} sub="active subscribers" />
      <StatCard label="New signups" value={stats.newSignups7d} sub="last 7 days" />
      <StatCard label="PDF Store revenue" value={formatPrice(stats.pdfRevenuePaise)} sub="all-time, paid orders" />
      <StatCard label="Open support tickets" value={stats.openTickets} />
    </div>
  );
}

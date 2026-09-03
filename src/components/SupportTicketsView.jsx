import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export default function SupportTicketsView() {
  const { getAuthHeaders } = useAuthGate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load support tickets.");
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || "Could not load support tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleStatus(ticket) {
    const nextStatus = ticket.status === "open" ? "resolved" : "open";
    setBusyId(ticket.id);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "update-status", ticketId: ticket.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update this ticket.");
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t)));
    } catch (err) {
      setError(err.message || "Could not update this ticket.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>;

  if (error) {
    return <p className="text-sm text-red-500 dark:text-red-400 text-center py-6">{error}</p>;
  }

  if (tickets.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">No support tickets yet.</p>;
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {ticket.reporterEmail} · {formatDate(ticket.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {ticket.priority === "high" && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  Premium
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                  ticket.status === "open"
                    ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                    : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                }`}
              >
                {ticket.status === "open" ? "Open" : "Resolved"}
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.message}</p>

          {ticket.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {ticket.attachments.map((a, i) =>
                a.url ? (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    📎 {a.name}
                  </a>
                ) : (
                  <span key={i} className="text-xs text-gray-400 dark:text-gray-500">
                    📎 {a.name} (unavailable)
                  </span>
                )
              )}
            </div>
          )}

          <button
            type="button"
            disabled={busyId === ticket.id}
            onClick={() => toggleStatus(ticket)}
            className="mt-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {ticket.status === "open" ? "Mark resolved" : "Reopen"}
          </button>
        </div>
      ))}
    </div>
  );
}

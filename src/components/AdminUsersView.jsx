import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

const TIER_BADGE = {
  pro: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
  premium: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
  free: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

export default function AdminUsersView() {
  const { getAuthHeaders } = useAuthGate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function loadUsers(searchTerm) {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "list-users", search: searchTerm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load users.");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadUsers(search);
  }

  async function grantComp(userId, tier) {
    setBusyId(userId);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "grant-comp", userId, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not grant this plan.");
      await loadUsers(search);
    } catch (err) {
      setError(err.message || "Could not grant this plan.");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeComp(userId, subscriptionId) {
    setBusyId(userId);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "revoke-comp", subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not revoke this plan.");
      await loadUsers(search);
    } catch (err) {
      setError(err.message || "Could not revoke this plan.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">No users found.</p>
      ) : (
        users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Joined {formatDate(u.createdAt)}
                {u.isAdmin && " · Admin"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TIER_BADGE[u.tier]}`}>
                {u.tier === "free" ? "Free" : u.tier === "pro" ? "Pro" : "Premium"}
                {u.isComp && " (comp)"}
              </span>

              {u.tier === "free" ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => grantComp(u.id, "pro")}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    Grant Pro
                  </button>
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => grantComp(u.id, "premium")}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    Grant Premium
                  </button>
                </div>
              ) : u.isComp ? (
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => revokeComp(u.id, u.subscriptionId)}
                  className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                >
                  Revoke comp
                </button>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

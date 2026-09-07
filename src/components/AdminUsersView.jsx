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

// Avoids visually-ambiguous characters (0/O, 1/I/l) since this is read back
// off the screen and retyped by hand.
const CAPTCHA_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCaptchaCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CAPTCHA_ALPHABET[Math.floor(Math.random() * CAPTCHA_ALPHABET.length)];
  }
  return code;
}

// Two-step guard in front of a permanent, irreversible action: an explicit
// "yes I understand" step, then a freshly-generated code the admin has to
// read and retype (a lightweight, self-hosted stand-in for a CAPTCHA —
// there's no bot risk on an already-authenticated admin route, the point is
// purely to force a deliberate, unhurried second look before the account and
// its data are gone for good).
function DeleteUserModal({ user, onCancel, onConfirm }) {
  const [step, setStep] = useState("confirm"); // "confirm" | "captcha"
  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode);
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function refreshCaptcha() {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput("");
  }

  async function handleFinalConfirm() {
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError("That code doesn't match. Try again.");
      refreshCaptcha();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Could not delete this user.");
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5">
        {step === "confirm" ? (
          <>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delete this user?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This permanently deletes <span className="font-medium">{user.email}</span> — their account, subscription,
              and purchase history. This can't be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("captcha")}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 text-sm transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Confirm deletion</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Type the code below to permanently delete <span className="font-medium">{user.email}</span>.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="select-none rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-lg font-mono font-bold tracking-[0.3em] text-gray-700 dark:text-gray-200">
                {captchaCode}
              </span>
              <button
                type="button"
                onClick={refreshCaptcha}
                title="Get a new code"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                New code
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Type the code above"
              className="mt-3 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm tracking-widest"
            />
            {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={submitting || !captchaInput.trim()}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 text-sm disabled:opacity-60 transition-colors"
              >
                {submitting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersView() {
  const { getAuthHeaders } = useAuthGate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  async function deleteUser(userId) {
    const authHeaders = await getAuthHeaders();
    const res = await apiFetch("/api/pdf-store/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ action: "delete-user", userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not delete this user.");
    setDeleteTarget(null);
    await loadUsers(search);
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

              {!u.isAdmin && (
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => setDeleteTarget(u)}
                  className="text-xs rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteUser(deleteTarget.id)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuthGate } from "../context/AuthGateContext.jsx";

const MIN_PASSWORD_LENGTH = 6;

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 " +
  "text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

const primaryButtonClass =
  "w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm " +
  "disabled:opacity-60 disabled:cursor-not-allowed transition-colors";

export default function ChangePasswordModal({ open, onClose }) {
  const { hasPasswordIdentity, changePassword } = useAuthGate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (!open) return null;

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setNotice(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setNotice("Password updated.");
    } catch (err) {
      setError(err.message || "Couldn't update your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {hasPasswordIdentity ? "Change password" : "Set a password"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-1 -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-950/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {notice ? (
          <div>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-950/50 rounded-lg px-3 py-2">
              {notice}
            </p>
            <button type="button" onClick={close} className={primaryButtonClass}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {hasPasswordIdentity && (
              <input
                type="password"
                placeholder="Current password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
              />
            )}
            <input
              type="password"
              placeholder="New password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              {isSubmitting ? "Updating..." : hasPasswordIdentity ? "Update password" : "Set password"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

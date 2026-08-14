import { useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

const MIN_PASSWORD_LENGTH = 6;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.44c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.24 21.3 7.28 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.63H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.37l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.63l4 3.09c.95-2.85 3.6-4.97 6.73-4.97z"
      />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 " +
  "text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500";

const primaryButtonClass =
  "w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm " +
  "disabled:opacity-60 disabled:cursor-not-allowed transition-colors";

const secondaryButtonClass =
  "w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 " +
  "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 font-medium px-4 py-2.5 text-sm " +
  "hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";

export default function AuthModal() {
  const {
    authView,
    closeAuthModal,
    openAuthModal,
    freeCreditLimit,
    remainingCredits,
    isSignedIn,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updatePassword,
  } = useAuthGate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (!authView) return null;

  function resetFormState() {
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setNotice(null);
  }

  function switchTo(view) {
    resetFormState();
    openAuthModal(view);
  }

  function close() {
    resetFormState();
    setEmail("");
    closeAuthModal();
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    try {
      await signInWithGoogle(marketingOptIn);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUpWithEmail(email, password, marketingOptIn);
      if (needsEmailConfirmation) {
        setNotice(`We sent a confirmation link to ${email}. Click it to finish creating your account.`);
      } else {
        close();
      }
    } catch (err) {
      setError(err.message || "Couldn't create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogIn(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      close();
    } catch (err) {
      setError(err.message || "Couldn't log you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setNotice(`If an account exists for ${email}, we've sent a password reset link.`);
    } catch (err) {
      setError(err.message || "Couldn't send the reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setNotice("Password updated. You're all set.");
    } catch (err) {
      setError(err.message || "Couldn't update your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const titles = {
    signup: "Create your account",
    login: "Log in",
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{titles[authView]}</h2>
          {authView !== "reset-password" && (
            <button
              type="button"
              onClick={close}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-1 -mt-1"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {authView === "signup" && !isSignedIn && remainingCredits === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You've used your {freeCreditLimit} free prompts — create a free account to keep going, no limits.
          </p>
        )}

        {!isSupabaseConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
            Sign-in isn't configured yet. Add Supabase credentials to enable this.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-950/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {notice && authView !== "reset-password" && (
          <p className="text-xs text-green-700 dark:text-green-400 mb-3 bg-green-50 dark:bg-green-950/50 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}

        {authView === "reset-password" ? (
          notice ? (
            <div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-950/50 rounded-lg px-3 py-2">
                {notice}
              </p>
              <button type="button" onClick={close} className={primaryButtonClass}>
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                required
                autoFocus
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
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || !isSupabaseConfigured}
              className={secondaryButtonClass}
            >
              <GoogleIcon />
              {isSubmitting ? "Redirecting..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            {authView === "signup" && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Email me product updates and tips. We'll only use your email for this — you can unsubscribe
                    anytime.
                  </span>
                </label>
                <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className={primaryButtonClass}>
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchTo("login")} className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Log in
                  </button>
                </p>
              </form>
            )}

            {authView === "login" && (
              <form onSubmit={handleLogIn} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => switchTo("forgot-password")} className="text-xs text-left text-indigo-600 dark:text-indigo-400">
                  Forgot password?
                </button>
                <button type="submit" disabled={isSubmitting || !isSupabaseConfigured} className={primaryButtonClass}>
                  {isSubmitting ? "Logging in..." : "Log in"}
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  New here?{" "}
                  <button type="button" onClick={() => switchTo("signup")} className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {authView === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={isSubmitting || !isSupabaseConfigured || Boolean(notice)} className={primaryButtonClass}>
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  <button type="button" onClick={() => switchTo("login")} className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Back to log in
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

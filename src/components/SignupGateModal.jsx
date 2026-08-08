import { useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

export default function SignupGateModal() {
  const { gateOpen, closeGate, freeCreditLimit, signInWithGoogle } = useAuthGate();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!gateOpen) return null;

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await signInWithGoogle(marketingOptIn);
    } finally {
      setIsSigningIn(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeGate}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            You've used your {freeCreditLimit} free prompts
          </h2>
          <button
            type="button"
            onClick={closeGate}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-1 -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Sign in with Google to keep translating and chatting with the AI tutor — free and unlimited.
        </p>

        {!isSupabaseConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
            Sign-in isn't configured yet. Add Supabase credentials to enable this.
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn || !isSupabaseConfigured}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 font-medium px-4 py-2.5 text-sm
                     hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
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
          {isSigningIn ? "Redirecting..." : "Continue with Google"}
        </button>

        <label className="flex items-start gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Email me product updates and tips. We'll only use your email for this — you can unsubscribe anytime.
          </span>
        </label>
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Mirrors the tier table in api/_lib/usageLimits.js's LIMITS — kept here as
// display copy since the frontend never calls that endpoint directly.
const PLANS = [
  {
    tier: "free",
    name: "Free",
    priceLabel: "₹0",
    features: ["5 translations/day", "5 AI tutor messages/day", "Each Playground game once/day"],
  },
  {
    tier: "pro",
    name: "Mighty Pro",
    priceLabel: "₹99/month",
    features: ["15 translations/day", "15 AI tutor messages/day", "Each Playground game 3×/day"],
  },
  {
    tier: "premium",
    name: "Mighty Premium",
    priceLabel: "₹249/month",
    features: [
      "25 translations/day",
      "25 AI tutor messages/day",
      "Each Playground game 6×/day",
      "Priority support ticket handling",
      "Early access to new features",
    ],
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscribeView() {
  const { isSignedIn, getAuthHeaders, openAuthModal, refreshTier } = useAuthGate();

  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyTier, setBusyTier] = useState(null);
  // null | "pro" | "premium" — drives the post-purchase celebration modal
  const [celebrateTier, setCelebrateTier] = useState(null);

  async function refreshStatus() {
    if (!isSignedIn) {
      setCurrentTier("free");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/my-purchases", { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCurrentTier(data.subscription?.tier || "free");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // `subscriptionId` is the id from our own create() response, not
  // response.razorpay_subscription_id — Razorpay's docs explicitly warn not
  // to use the Checkout-echoed value for verification, only the one your own
  // server already issued.
  async function handleVerify(subscriptionId, tier, response) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "verify",
          subscriptionId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment verification failed. If you were charged, please contact support.");
        return;
      }
      // refreshTier updates the NavBar avatar badge immediately, not just
      // this view's own plan cards.
      await Promise.all([refreshStatus(), refreshTier()]);
      setCelebrateTier(tier);
    } catch {
      setError("Payment succeeded but we couldn't confirm it. Please refresh and check your plan.");
    } finally {
      setBusyTier(null);
    }
  }

  async function handleSubscribe(tier) {
    if (!isSignedIn) {
      openAuthModal("login");
      return;
    }
    setError(null);
    setBusyTier(tier);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "create", tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start the subscription.");
        setBusyTier(null);
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setError("Could not load the payment widget. Check your connection and try again.");
        setBusyTier(null);
        return;
      }

      const plan = PLANS.find((p) => p.tier === tier);
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "LangMighty",
        description: plan.name,
        handler: (response) => handleVerify(data.subscriptionId, tier, response),
        modal: { ondismiss: () => setBusyTier(null) },
      });
      rzp.open();
    } catch {
      setError("Could not start the subscription. Please try again.");
      setBusyTier(null);
    }
  }

  async function handleCancel() {
    setError(null);
    setBusyTier(currentTier);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not cancel your subscription.");
        return;
      }
      await refreshStatus();
    } catch {
      setError("Could not cancel your subscription. Please try again.");
    } finally {
      setBusyTier(null);
    }
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Plans</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Higher daily limits for Translate, AI Chat, and Playground.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const isPaid = plan.tier !== "free";
            return (
              <div
                key={plan.tier}
                className={`rounded-2xl border p-5 flex flex-col gap-4 ${
                  isCurrent
                    ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400 dark:ring-indigo-500"
                    : "border-gray-200 dark:border-gray-800"
                } bg-white dark:bg-gray-900`}
              >
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h2>
                  <p className="mt-1 text-lg font-semibold text-indigo-600 dark:text-indigo-400">{plan.priceLabel}</p>
                </div>
                <ul className="flex-1 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>

                {isCurrent ? (
                  isPaid ? (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={busyTier === plan.tier}
                      className="rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
                    >
                      {busyTier === plan.tier ? "Cancelling…" : "Cancel plan"}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 text-center">Current plan</span>
                  )
                ) : isPaid ? (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading || busyTier === plan.tier || (currentTier !== "free" && !isCurrent)}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors"
                  >
                    {busyTier === plan.tier
                      ? "Processing…"
                      : isSignedIn
                        ? `Subscribe to ${plan.name}`
                        : "Sign in to subscribe"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {currentTier !== "free" && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Switching plans isn't automatic yet — cancel your current plan first, then subscribe to the other one.
          </p>
        )}
      </div>

      {celebrateTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-w-sm w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 text-center overflow-hidden">
            <div className="absolute inset-x-0 top-0 text-2xl tracking-widest opacity-80 pt-2" aria-hidden="true">
              🎉 ✨ 🎊 ✨ 🎉
            </div>
            <div className="mt-8 text-5xl" aria-hidden="true">
              {celebrateTier === "premium" ? "👑" : "⭐"}
            </div>
            <h2 className="mt-3 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Welcome to Mighty {celebrateTier === "premium" ? "Premium" : "Pro"}!
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your higher daily limits are active right now — go put them to use.
            </p>
            <button
              type="button"
              onClick={() => setCelebrateTier(null)}
              className="mt-5 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 text-sm transition-colors"
            >
              Let's go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

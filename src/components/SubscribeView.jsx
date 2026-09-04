import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { useAuthGate } from "../context/AuthGateContext.jsx";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Mirrors the tier table in api/_lib/usageLimits.js's LIMITS — kept here as
// display copy since the frontend never calls that endpoint directly. The
// actual amount Razorpay charges is set once in the Plan itself (see
// scripts/seedSubscriptionPlans.mjs) and always matches `price` below —
// `originalPrice` is a display-only anchor price, not a real discount applied
// anywhere server-side.
const PLANS = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    features: ["5 translations/day", "5 AI tutor messages/day", "Each Playground game once/day"],
  },
  {
    tier: "pro",
    name: "Mighty Pro",
    originalPrice: 299,
    price: 99,
    features: ["15 translations/day", "15 AI tutor messages/day", "Each Playground game 3×/day"],
  },
  {
    tier: "premium",
    name: "Mighty Premium",
    originalPrice: 499,
    price: 249,
    popular: true,
    features: [
      "25 translations/day",
      "25 AI tutor messages/day",
      "Each Playground game 6×/day",
      "Priority support ticket handling",
      "Early access to new features",
    ],
  },
];

// Placeholder content — swap these three in for real quotes from real users
// (with their permission to display) whenever you have them. Structure/
// styling is done; only the text needs replacing.
const TESTIMONIALS = [
  {
    quote: "Add a real testimonial quote from one of your learners here.",
    name: "Learner name, City",
  },
  {
    quote: "Add a real testimonial quote from one of your learners here.",
    name: "Learner name, City",
  },
  {
    quote: "Add a real testimonial quote from one of your learners here.",
    name: "Learner name, City",
  },
];

const FAQS = [
  {
    question: "What happens to my usage limits when I subscribe?",
    answer:
      "Free accounts get 5 translations/day, 5 AI tutor messages/day, and 1 play/day per Playground game. Mighty Pro raises that to 15/15/3, and Mighty Premium to 25/25/6 — the higher limits apply immediately once your payment is verified.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancelling stops future billing but keeps your plan active through the period you already paid for — you won't lose access early or get a partial refund for the current cycle.",
  },
  {
    question: "Can I switch between Mighty Pro and Mighty Premium?",
    answer: "Not automatically yet — cancel your current plan first, then subscribe to the other one.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "Cards, UPI, netbanking, and wallets — anything Razorpay Checkout supports.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Yes. Checkout is handled entirely by Razorpay — LangMighty never sees or stores your card, UPI, or bank details.",
  },
  {
    question: "What happens if I don't use all of today's free translations or messages?",
    answer: "They don't roll over — your daily limit simply resets at the start of the next day (UTC).",
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

  // null (not yet loaded) | "free" | "pro" | "premium" — starts null so the
  // Free card doesn't briefly render as "Current plan" before the real
  // subscription status has actually loaded (see isCurrent below).
  const [currentTier, setCurrentTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyTier, setBusyTier] = useState(null);
  // null | "pro" | "premium" — drives the post-purchase celebration modal
  const [celebrateTier, setCelebrateTier] = useState(null);
  // Index of the open FAQ accordion row, or null if all are collapsed.
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const isPaid = plan.tier !== "free";
            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-5 flex flex-col gap-4 ${
                  plan.popular
                    ? "bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20 sm:-my-2 sm:py-7"
                    : "border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                } ${
                  isCurrent && !plan.popular ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400 dark:ring-indigo-500" : ""
                } ${isCurrent && plan.popular ? "ring-2 ring-amber-300" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-5 rounded-full bg-amber-400 text-amber-950 text-xs font-semibold px-3 py-1 shadow">
                    🎁 Most popular
                  </span>
                )}

                <div>
                  <h2 className={`font-semibold ${plan.popular ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                    {plan.originalPrice && (
                      <span className={`text-base line-through ${plan.popular ? "text-white/60" : "text-gray-400 dark:text-gray-500"}`}>
                        ₹{plan.originalPrice}
                      </span>
                    )}
                    <span className={`text-3xl font-bold ${plan.popular ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
                      ₹{plan.price}
                    </span>
                    {isPaid && (
                      <span className={`text-sm ${plan.popular ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>/month</span>
                    )}
                  </div>
                </div>

                <ul className={`flex-1 space-y-1.5 text-sm ${plan.popular ? "text-white/90" : "text-gray-600 dark:text-gray-300"}`}>
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
                      className={`rounded-lg font-medium px-4 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                        plan.popular
                          ? "bg-white/10 border border-white/40 text-white hover:bg-white/20"
                          : "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
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
                    className={`rounded-lg font-medium px-4 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                      plan.popular
                        ? "bg-white text-indigo-700 hover:bg-white/90"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
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

        {(currentTier === "pro" || currentTier === "premium") && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Switching plans isn't automatic yet — cancel your current plan first, then subscribe to the other one.
          </p>
        )}

        <div className="pt-6">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
            What others are saying about us?
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 pb-4">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">Frequently asked questions</h2>
          <div className="mt-6 max-w-2xl mx-auto divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {FAQS.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    {faq.question}
                    <span
                      className={`flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? "rotate-45" : ""}`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  {isOpen && <p className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
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

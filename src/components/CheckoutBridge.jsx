import { useEffect, useState } from "react";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

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

function redirectWithParams(redirectTo, params) {
  const url = new URL(redirectTo);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value);
  });
  window.location.href = url.toString();
}

// A deliberately standalone bridge, outside App.jsx's view state machine —
// mobile can't run Razorpay's checkout.js itself, so it opens this page (via
// expo-web-browser, the same mechanism it already uses for Google OAuth) and
// gets the payment result back through `redirectTo`, a deep link it computed
// for itself. This page never sees a Supabase session — mobile calls
// create-order/verify-payment itself with its own bearer token.
export default function CheckoutBridge() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const amountPaise = params.get("amountPaise");
    const currency = params.get("currency");
    const keyId = params.get("keyId");
    const title = params.get("title");
    const pdfId = params.get("pdfId");
    const redirectTo = params.get("redirectTo");

    if (!orderId || !amountPaise || !currency || !keyId || !pdfId || !redirectTo) {
      setError("This checkout link is missing required information.");
      return;
    }

    let cancelled = false;

    loadRazorpayScript().then((ready) => {
      if (cancelled) return;
      if (!ready) {
        setError("Could not load the payment widget. Check your connection and try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount: Number(amountPaise),
        currency,
        name: "LangMighty",
        description: title || undefined,
        handler: (response) => {
          redirectWithParams(redirectTo, {
            status: "success",
            pdfId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            redirectWithParams(redirectTo, { status: "cancelled", pdfId });
          },
        },
      });
      rzp.open();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Opening secure checkout…</p>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";

const OFFER_DURATION_MS = 12 * 60 * 60 * 1000;
const DEADLINE_KEY = "langlearn_pdf_offer_deadline";

// Persists the deadline itself (not just "12 hours from mount"), so reloading
// the page doesn't reset the countdown back to the full 12 hours. Advances in
// fixed 12-hour hops past `now` rather than jumping to "now + 12h", so the
// cycle stays aligned even if a tab reopens well after its deadline passed.
function loadDeadline() {
  const stored = Number(localStorage.getItem(DEADLINE_KEY));
  let deadline = Number.isFinite(stored) && stored > 0 ? stored : Date.now() + OFFER_DURATION_MS;
  while (deadline <= Date.now()) {
    deadline += OFFER_DURATION_MS;
  }
  localStorage.setItem(DEADLINE_KEY, String(deadline));
  return deadline;
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

// Seeded as soon as this module is evaluated — part of the app's initial bundle
// (no lazy-loading here), so this runs at first page load, not lazily inside
// the component. Otherwise the deadline wouldn't get written to localStorage
// until the user actually opened PDF Store, making the countdown look like it
// "starts" whenever they first click that tab instead of when they arrived.
const initialDeadline = loadDeadline();

export default function OfferCountdownBanner() {
  const [deadline, setDeadline] = useState(initialDeadline);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (now < deadline) return;
    const next = deadline + OFFER_DURATION_MS;
    localStorage.setItem(DEADLINE_KEY, String(next));
    setDeadline(next);
  }, [now, deadline]);

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-950 dark:via-orange-950 dark:to-red-950 px-4 py-2.5 flex items-center justify-center gap-2 text-sm">
      <span className="animate-pulse">🔥</span>
      <span className="font-medium text-red-700 dark:text-red-300">Offer ends soon —</span>
      <span className="font-mono font-bold text-red-800 dark:text-red-200 tabular-nums">
        {formatRemaining(deadline - now)}
      </span>
    </div>
  );
}

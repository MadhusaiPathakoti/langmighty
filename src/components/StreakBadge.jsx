import { useState } from "react";

const STREAK_KEY = "langlearn_streak";

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Local calendar days, not a rolling 24h window, so a streak survives visiting
// at 11pm one day and 7am the next rather than requiring exactly 24h between visits.
function computeStreak() {
  const today = toDateKey(new Date());
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(STREAK_KEY));
  } catch {
    stored = null;
  }

  if (!stored || typeof stored.count !== "number" || !stored.lastDate) {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 1, lastDate: today }));
    return 1;
  }
  if (stored.lastDate === today) {
    return stored.count;
  }

  const yesterday = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const next = stored.lastDate === yesterday ? stored.count + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: next, lastDate: today }));
  return next;
}

// Computed once at module evaluation (same pattern as OfferCountdownBanner's initialDeadline)
// so today's visit is counted as soon as the app loads, not only once this component mounts.
const initialStreak = computeStreak();

export default function StreakBadge() {
  const [streak] = useState(initialStreak);

  return (
    <span
      title={`${streak} day${streak === 1 ? "" : "s"} in a row`}
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400
                 bg-orange-50 dark:bg-orange-950 flex items-center gap-1 whitespace-nowrap"
    >
      🔥 {streak}
    </span>
  );
}

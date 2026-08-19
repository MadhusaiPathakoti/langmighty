import { useAuthGate } from "../context/AuthGateContext.jsx";

// The actual streak computation (device-local guest streak vs. account-synced
// streak once signed in) lives in AuthGateContext — this just renders it.
export default function StreakBadge() {
  const { streak } = useAuthGate();

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

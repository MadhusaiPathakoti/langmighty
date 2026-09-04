import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const PENDING_OPT_IN_KEY = "langlearn_pending_marketing_opt_in";
const PENDING_REFERRAL_CODE_KEY = "langlearn_pending_referral_code";
const STREAK_KEY = "langlearn_streak";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey() {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Local calendar days, not a rolling 24h window, so a streak survives visiting
// at 11pm one day and 7am the next rather than requiring exactly 24h between
// visits. `stored` may be null/malformed (first-ever visit, or corrupt JSON).
function nextStreak(stored) {
  const today = todayKey();
  if (!stored || typeof stored.count !== "number" || !stored.lastDate) {
    return { count: 1, lastDate: today };
  }
  if (stored.lastDate === today) return { count: stored.count, lastDate: today };
  const count = stored.lastDate === yesterdayKey() ? stored.count + 1 : 1;
  return { count, lastDate: today };
}

function loadLocalStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Device-local guest streak — used as-is for signed-out visitors, and as a
// one-time seed value the first time a signed-in account starts being tracked
// server-side (see the streak-sync effect below).
function updateLocalStreak() {
  const result = nextStreak(loadLocalStreak());
  localStorage.setItem(STREAK_KEY, JSON.stringify(result));
  return result.count;
}

const AuthGateContext = createContext(null);

export function AuthGateProvider({ children }) {
  const [session, setSession] = useState(null);
  const [streak, setStreak] = useState(() => updateLocalStreak());
  // null | "signup" | "login" | "forgot-password" | "reset-password"
  const [authView, setAuthView] = useState(null);
  // null | { feature: "translate" | "chat" | "game", limit: number }
  const [limitReached, setLimitReached] = useState(null);
  // null (not yet loaded) | 'free' | 'pro' | 'premium' — mirrors
  // api/_lib/subscription.js's getUserTier, fetched via my-purchases
  // (subscriptions has no client-readable RLS policies — service-role only —
  // so this can't be a direct Supabase query the way streak above is).
  // Starts null rather than defaulting to 'free' so nothing briefly renders
  // "you're on Free" as fact before the real tier has actually loaded.
  const [tier, setTier] = useState(null);
  // Piggybacked onto the same my-purchases fetch as tier below (see
  // refreshTier) rather than a second network call — drives the "Admin
  // dashboard" entry in NavBar's account menu.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession?.user) {
        void saveProfileOnSignIn(newSession.user);
        void applyPendingReferralCode(newSession.access_token);
      }
      // Supabase parses the recovery link's URL fragment on load and fires this event
      // instead of a normal SIGNED_IN — that's our signal to show the "set a new
      // password" form rather than treating it as an ordinary sign-in.
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("reset-password");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Once signed in, the account's own streak_count/last_streak_date in
  // `profiles` becomes the source of truth instead of this device's local
  // guest streak, so the same account shows the same streak on every device
  // (mobile, laptop, ...) rather than each one counting separately. The very
  // first time an account gets tracked (no streak_count yet), it's seeded
  // from this device's current local streak instead of starting over at 1.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("streak_count, last_streak_date")
          .eq("id", userId)
          .maybeSingle();

        const result = data?.streak_count
          ? nextStreak({ count: data.streak_count, lastDate: data.last_streak_date })
          : { count: Math.max(loadLocalStreak()?.count ?? 1, 1), lastDate: todayKey() };

        if (cancelled) return;
        setStreak(result.count);
        // The account is now authoritative — clear the local guest count so a
        // later sign-out on this device starts a fresh guest streak instead
        // of resurrecting this now-irrelevant number.
        localStorage.removeItem(STREAK_KEY);
        await supabase
          .from("profiles")
          .update({ streak_count: result.count, last_streak_date: result.lastDate })
          .eq("id", userId);
      } catch {
        // Fails open — keep showing whatever streak value is already set
        // rather than blocking on a network/RLS issue.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Piggybacks on the same "everything about this signed-in user" endpoint
  // PdfStoreView already calls (see CLAUDE.md on my-purchases) rather than a
  // dedicated status route. Exposed as refreshTier so SubscribeView can call
  // it right after a successful subscribe/cancel instead of waiting for the
  // next sign-in event to pick up the new tier.
  async function refreshTier() {
    const userId = session?.user?.id;
    if (!userId || !isSupabaseConfigured) {
      setTier("free");
      setIsAdmin(false);
      return;
    }
    try {
      const authHeaders = await getAuthHeaders();
      const res = await apiFetch("/api/pdf-store/my-purchases", { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setTier(data.subscription?.tier || "free");
      setIsAdmin(Boolean(data.isAdmin));
    } catch {
      // Fails open — keep showing whatever tier/admin state is already set
      // rather than blocking on a network hiccup.
    }
  }

  useEffect(() => {
    refreshTier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function saveProfileOnSignIn(user) {
    const pending = localStorage.getItem(PENDING_OPT_IN_KEY);
    if (pending === null) return; // profile already saved for this browser, nothing pending

    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      marketing_opt_in: pending === "true",
    });
    localStorage.removeItem(PENDING_OPT_IN_KEY);
  }

  // Deliberately separate from saveProfileOnSignIn above — that one early-
  // returns when there's no pending marketing opt-in (e.g. a returning
  // user), which would otherwise skip this too. A pending referral code
  // (see App.jsx's `?ref=` effect) isn't tied to that flag at all, so this
  // runs independently on every SIGNED_IN event.
  async function applyPendingReferralCode(accessToken) {
    const code = localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
    if (!code || !accessToken) return;
    localStorage.removeItem(PENDING_REFERRAL_CODE_KEY); // one attempt only, never retried
    try {
      await apiFetch("/api/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: "apply-referral", referralCode: code }),
      });
    } catch {
      // Best-effort — a missed attribution isn't worth surfacing to the user.
    }
  }

  const isSignedIn = Boolean(session?.user);
  // Whether this account has a password set (vs. Google-only) — determines whether
  // "change password" needs to verify a current password first.
  const hasPasswordIdentity = Boolean(
    session?.user?.identities?.some((identity) => identity.provider === "email")
  );

  // The client-side view gate (see App.jsx) is just a UX shortcut to keep signed-out
  // visitors off the feature views entirely; the server enforces the real requirement
  // (see api/_lib/creditGate.js's requireSignedIn), since that gate can't be bypassed
  // by calling the API directly. Call this when a request comes back 401
  // AUTH_REQUIRED (e.g. the session expired mid-use) so the login prompt reappears.
  function reportAuthRequired() {
    setAuthView("login");
  }

  // Same idea as reportAuthRequired, for the other server-enforced gate: call
  // this when a request comes back 429 LIMIT_REACHED (see api/_lib/
  // usageLimits.js) so the upgrade prompt appears. `tier` (the caller's
  // current plan) lets UpgradeWall decide whether there's actually something
  // higher to upsell — a Premium user hitting their own cap has nothing to
  // upgrade to.
  function reportLimitReached(feature, limit, tier) {
    setLimitReached({ feature, limit, tier: tier || "free" });
  }

  function dismissLimitReached() {
    setLimitReached(null);
  }

  async function getAuthHeaders() {
    if (!isSupabaseConfigured) return {};
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // The refresh token itself was rejected (expired/revoked) — the nav bar's
      // "signed in" state is now stale since it only updates on auth *events*, not
      // on this getSession() call. Clear it locally (no network call, can't fail)
      // so the UI stops claiming the user is signed in when every authenticated
      // request is actually about to 401.
      await supabase.auth.signOut({ scope: "local" });
    }
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function signInWithGoogle(marketingOptIn) {
    localStorage.setItem(PENDING_OPT_IN_KEY, String(marketingOptIn));
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function signUpWithEmail(email, password, marketingOptIn) {
    localStorage.setItem(PENDING_OPT_IN_KEY, String(marketingOptIn));
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      localStorage.removeItem(PENDING_OPT_IN_KEY);
      throw error;
    }
    // If email confirmation is required, Supabase returns a user but no session yet.
    return { needsEmailConfirmation: !data.session };
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  // For the "forgot password" email-link flow, where PASSWORD_RECOVERY already
  // proved identity via the emailed token — no current password to check.
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  // For a signed-in user proactively changing their password. Re-verifies the
  // current password first when one exists, since a long-lived session token alone
  // shouldn't be enough to lock the real owner out by changing it to something else.
  // Google-only accounts have no existing password to check, so this just sets one.
  async function changePassword(currentPassword, newPassword) {
    if (hasPasswordIdentity) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error("Current password is incorrect.");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // The global sign-out hits the server to revoke the refresh token; if that
      // call itself fails (offline, or the session was already dead), fall back to
      // a local-only sign-out so the user isn't stuck looking signed in with no
      // way to clear it from this device.
      console.error("Sign out failed, clearing local session instead:", err);
      await supabase.auth.signOut({ scope: "local" });
    }
  }

  return (
    <AuthGateContext.Provider
      value={{
        isSignedIn,
        userEmail: session?.user?.email ?? null,
        hasPasswordIdentity,
        streak,
        reportAuthRequired,
        getAuthHeaders,
        authView,
        openAuthModal: (view = "login") => setAuthView(view),
        closeAuthModal: () => setAuthView(null),
        limitReached,
        reportLimitReached,
        dismissLimitReached,
        tier,
        refreshTier,
        isAdmin,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendPasswordReset,
        updatePassword,
        changePassword,
        signOut,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used within an AuthGateProvider");
  return ctx;
}

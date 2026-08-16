import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const FREE_CREDIT_LIMIT = 3;
const CREDITS_KEY = "langlearn_credits_used";
const PENDING_OPT_IN_KEY = "langlearn_pending_marketing_opt_in";

function loadCreditsUsed() {
  const raw = localStorage.getItem(CREDITS_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

const AuthGateContext = createContext(null);

export function AuthGateProvider({ children }) {
  const [session, setSession] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(loadCreditsUsed);
  // null | "signup" | "login" | "forgot-password" | "reset-password"
  const [authView, setAuthView] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession?.user) {
        void saveProfileOnSignIn(newSession.user);
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

  const isSignedIn = Boolean(session?.user);
  const remainingCredits = Math.max(0, FREE_CREDIT_LIMIT - creditsUsed);
  const canUseFeature = isSignedIn || remainingCredits > 0;
  // Whether this account has a password set (vs. Google-only) — determines whether
  // "change password" needs to verify a current password first.
  const hasPasswordIdentity = Boolean(
    session?.user?.identities?.some((identity) => identity.provider === "email")
  );

  function consumeCredit() {
    if (isSignedIn) return;
    setCreditsUsed((prev) => {
      const next = prev + 1;
      localStorage.setItem(CREDITS_KEY, String(next));
      return next;
    });
  }

  function requestAccess() {
    if (canUseFeature) return true;
    setAuthView("signup");
    return false;
  }

  // The client-side check above is just a UX shortcut to skip an obviously-doomed
  // request; the server enforces the real limit (see api/_lib/creditGate.js), since
  // localStorage can be cleared or bypassed entirely. Call this when a request comes
  // back 403 so the badge and modal reflect the server's authoritative decision.
  function reportServerRejection() {
    setCreditsUsed(FREE_CREDIT_LIMIT);
    localStorage.setItem(CREDITS_KEY, String(FREE_CREDIT_LIMIT));
    setAuthView("signup");
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
        freeCreditLimit: FREE_CREDIT_LIMIT,
        remainingCredits,
        canUseFeature,
        consumeCredit,
        requestAccess,
        reportServerRejection,
        getAuthHeaders,
        authView,
        openAuthModal: (view = "login") => setAuthView(view),
        closeAuthModal: () => setAuthView(null),
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

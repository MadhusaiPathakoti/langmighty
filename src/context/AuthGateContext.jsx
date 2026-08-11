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
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession?.user) {
        void saveProfileOnSignIn(newSession.user);
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
    setGateOpen(true);
    return false;
  }

  // The client-side check above is just a UX shortcut to skip an obviously-doomed
  // request; the server enforces the real limit (see api/_lib/creditGate.js), since
  // localStorage can be cleared or bypassed entirely. Call this when a request comes
  // back 403 so the badge and modal reflect the server's authoritative decision.
  function reportServerRejection() {
    setCreditsUsed(FREE_CREDIT_LIMIT);
    localStorage.setItem(CREDITS_KEY, String(FREE_CREDIT_LIMIT));
    setGateOpen(true);
  }

  async function getAuthHeaders() {
    if (!isSupabaseConfigured) return {};
    const { data } = await supabase.auth.getSession();
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

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthGateContext.Provider
      value={{
        isSignedIn,
        userEmail: session?.user?.email ?? null,
        freeCreditLimit: FREE_CREDIT_LIMIT,
        remainingCredits,
        canUseFeature,
        consumeCredit,
        requestAccess,
        reportServerRejection,
        getAuthHeaders,
        gateOpen,
        openGate: () => setGateOpen(true),
        closeGate: () => setGateOpen(false),
        signInWithGoogle,
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

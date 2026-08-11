import { createContext, useContext, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const FREE_CREDIT_LIMIT = 3;
const CREDITS_KEY = "langlearn_credits_used";
const PENDING_OPT_IN_KEY = "langlearn_pending_marketing_opt_in";
// Must match: the intent-filter/CFBundleURLSchemes entries added to
// android/app/src/main/AndroidManifest.xml and ios/App/App/Info.plist, and
// the Redirect URLs allow-list in the Supabase dashboard (Authentication ->
// URL Configuration) — Supabase rejects the redirect if it isn't allow-listed.
const NATIVE_AUTH_CALLBACK_URL = "com.langmighty.app://auth-callback";

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

  // Google's OAuth consent screen opens in the native in-app browser (see
  // signInWithGoogle below), not this app's own WebView. When it's done, the OS
  // routes the NATIVE_AUTH_CALLBACK_URL redirect back to the app as an
  // appUrlOpen event rather than a normal page navigation, so the session
  // tokens Supabase appends to that URL have to be picked up here instead of
  // via supabase.auth's own detectSessionInUrl (which only watches the page's
  // actual location, and this URL never becomes that).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerHandle = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith(NATIVE_AUTH_CALLBACK_URL)) return;

      await Browser.close().catch(() => {});

      const params = new URLSearchParams(url.split("#")[1] ?? "");
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    });

    return () => {
      listenerHandle.then((handle) => handle.remove());
    };
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

    if (Capacitor.isNativePlatform()) {
      // skipBrowserRedirect: Supabase would otherwise try to navigate this
      // WebView to Google, which Google blocks — hand the URL to a real
      // system browser instead, and pick the result up via appUrlOpen above.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: NATIVE_AUTH_CALLBACK_URL, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error ?? new Error("Could not start Google sign-in.");
      await Browser.open({ url: data.url });
      return;
    }

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

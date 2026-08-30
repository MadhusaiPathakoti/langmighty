import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import CheckoutBridge from "./components/CheckoutBridge.jsx";
import { AuthGateProvider } from "./context/AuthGateContext.jsx";
import AiTutorLandingPage from "./pages/seo/AiTutorLandingPage.jsx";
import LearnLanguageLandingPage from "./pages/seo/LearnLanguageLandingPage.jsx";
import TranslatorLandingPage from "./pages/seo/TranslatorLandingPage.jsx";
import { LANGUAGE_KEYS, TRANSLATOR_PAIRS } from "./pages/seo/seoContent.js";
import "./index.css";

// The checkout bridge is a standalone page for the mobile app's Razorpay
// hand-off (see CheckoutBridge.jsx) — checked before anything else mounts so
// it never touches App.jsx's view state machine.
const root = ReactDOM.createRoot(document.getElementById("root"));

if (window.location.pathname === "/checkout") {
  root.render(
    <React.StrictMode>
      <CheckoutBridge />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <AuthGateProvider>
        <BrowserRouter>
          <Routes>
            {TRANSLATOR_PAIRS.map(({ from, to }) => (
              <Route
                key={`${from}-${to}`}
                path={`/${from}-to-${to}-translator`}
                element={<TranslatorLandingPage fromKey={from} toKey={to} />}
              />
            ))}
            {LANGUAGE_KEYS.map((key) => (
              <Route key={key} path={`/learn-${key}-online`} element={<LearnLanguageLandingPage languageKey={key} />} />
            ))}
            <Route path="/ai-language-tutor" element={<AiTutorLandingPage />} />
            {/* Everything else — including "/" — is App.jsx's own view-switcher,
                unchanged from before routing was introduced. */}
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </AuthGateProvider>
    </React.StrictMode>
  );
}

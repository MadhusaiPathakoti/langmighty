import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CheckoutBridge from "./components/CheckoutBridge.jsx";
import { AuthGateProvider } from "./context/AuthGateContext.jsx";
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
        <App />
      </AuthGateProvider>
    </React.StrictMode>
  );
}

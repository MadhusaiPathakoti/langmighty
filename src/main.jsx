import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthGateProvider } from "./context/AuthGateContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGateProvider>
      <App />
    </AuthGateProvider>
  </React.StrictMode>
);

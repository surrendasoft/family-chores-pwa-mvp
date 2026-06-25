import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { dlog } from "./lib/debug";
import { setupServiceWorkerUpdates } from "./lib/serviceWorkerUpdate";

window.addEventListener("error", (e) => {
  dlog("error", "window.onerror", e.message || String(e.error));
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  dlog("error", "unhandledrejection", reason instanceof Error ? reason : String(reason));
});

dlog("info", `App boot on ${window.location.href}`);

void setupServiceWorkerUpdates();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Force the PWA service worker to invalidate immediately on every new publish.
// `autoUpdate` + `skipWaiting`/`clientsClaim` (vite.config.ts) make the new SW
// take control as soon as it's installed; we then reload the page so the
// freshly-activated SW serves the new index.html and JS chunks right away —
// no hard refresh required from the user.
let reloading = false;
const reloadOnce = () => {
  if (reloading) return;
  reloading = true;
  // Defer slightly so the new SW has fully claimed clients before navigation.
  setTimeout(() => window.location.reload(), 50);
};

// When a new SW takes control of this page, reload to pick up new assets.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
}

registerSW({
  immediate: true,
  onNeedRefresh() {
    // New SW is waiting; activate it now. `skipWaiting` + `clientsClaim`
    // will fire `controllerchange`, which triggers the reload above.
    reloadOnce();
  },
  onRegistered(registration) {
    // Poll for updates every 60s so long-lived tabs pick up new builds
    // without waiting for a manual navigation.
    if (registration) {
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60_000);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);

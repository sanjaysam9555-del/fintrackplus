import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

// Prompt users to reload when a new version is available (prevents "old UI" situations).
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast("Update available", {
      description: "Reload to get the latest fixes.",
      duration: 10000,
      action: {
        label: "Reload",
        onClick: () => updateSW(true),
      },
    });
  },
});

createRoot(document.getElementById("root")!).render(<App />);

"use client";

import { useEffect } from "react";

// Registers the service worker on first load so the PWA is installable —
// Chrome only fires `beforeinstallprompt` when an active SW with a fetch
// handler is present. It also means push opt-in later finds an existing
// registration instead of registering on demand. The SW does not cache
// (see public/sw.js), so this has no effect on page freshness.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // best-effort: install / push simply stay unavailable on failure
      });
    };

    // Defer to `load` so SW registration never competes with first paint.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

// Minimal service worker for web push.
// Responsibilities:
//   1. Show a system notification when a push event arrives
//   2. Open the relevant page (default /plan) when the user clicks it
//
// We deliberately do NOT cache resources here — Next.js + Vercel
// already handle the asset/HTTP cache layer. Caching would risk
// serving stale pages without an explicit invalidation story.

self.addEventListener("push", (event) => {
  let payload = { title: "InsulinReset", body: "Време за дневния чеклист", url: "/plan" };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // ignore — payload defaults are safe
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/apple-icon-180.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/plan" },
      // tag so a second morning push replaces the first instead of stacking
      tag: "insulinreset-daily",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/plan";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      // If a tab is already open, focus it and navigate.
      for (const client of all) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(target).catch(() => {});
          }
          return;
        }
      }
      // Otherwise open a fresh window.
      return clients.openWindow(target);
    })
  );
});

// Installability requirement: Chrome only fires `beforeinstallprompt` when the
// active service worker registers a fetch handler. We intentionally do NOT
// cache (see the note at the top), so this is a no-op that lets every request
// proceed to the network exactly as before — it exists purely to satisfy the
// install criterion that powers the "Инсталирай приложението" CTA.
self.addEventListener("fetch", () => {});

"use client";

// Minimal in-process toast bus. No deps, no provider — just an event
// emitter; the <Toast /> component subscribes and renders the latest msg.

type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function showToast(msg: string): void {
  listeners.forEach((l) => l(msg));
}

export function subscribeToast(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

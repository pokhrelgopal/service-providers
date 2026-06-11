"use client";

import { useSyncExternalStore } from "react";

import { getSocket } from "@/lib/socket";

export type ConnectionState = "online" | "reconnecting" | "offline";

/**
 * Live realtime connection status, combining the browser's network state with
 * the Socket.IO connection:
 *  - `offline`      — the device has no internet (navigator.onLine === false)
 *  - `reconnecting` — online, but the socket isn't connected yet (dropped / retrying)
 *  - `online`       — socket connected and ready
 *
 * Backed by `useSyncExternalStore` so any number of components stay in sync
 * without prop-drilling or duplicate listeners.
 */
export function useConnectionState(): ConnectionState {
  return useSyncExternalStore(subscribe, getSnapshot, () => "online");
}

function subscribe(onChange: () => void): () => void {
  const socket = getSocket();
  socket.on("connect", onChange);
  socket.on("disconnect", onChange);
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    socket.off("connect", onChange);
    socket.off("disconnect", onChange);
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): ConnectionState {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";
  return getSocket().connected ? "online" : "reconnecting";
}

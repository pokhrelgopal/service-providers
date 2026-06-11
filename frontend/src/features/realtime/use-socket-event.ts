"use client";

import { useEffect, useRef } from "react";

import { getSocket } from "@/lib/socket";

/** Subscribe to a socket event. The handler can change between renders without
 * re-subscribing (kept in a ref). */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event, enabled]);
}

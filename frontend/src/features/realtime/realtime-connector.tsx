"use client";

import { useEffect } from "react";

import { connectSocket, disconnectSocket } from "@/lib/socket";
import { preloadAppSounds } from "@/lib/sounds";
import { useMe } from "@/features/auth";

/** Opens the socket once the user is authenticated; closes it on logout.
 * Render once inside the authenticated area. */
export function RealtimeConnector() {
  const me = useMe();
  const userId = me.data?.id;

  useEffect(() => {
    if (!userId) return;
    connectSocket();
    void preloadAppSounds();
    return () => disconnectSocket();
  }, [userId]);

  return null;
}

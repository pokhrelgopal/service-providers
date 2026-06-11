import { io, type Socket } from "socket.io-client";

import { resolveSocketUrl } from "./env";
import { getAccessToken } from "./auth-token";

let socket: Socket | null = null;

/** Lazily-created app-wide socket. The `auth` callback runs on every (re)connect
 * so the latest access token (after a refresh) is always sent. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => cb({ token: getAccessToken() ?? "" }),
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

/** Fire-and-forget emit (no-op if not connected). */
export function emitSocket(event: string, payload: unknown): void {
  const s = getSocket();
  if (s.connected) s.emit(event, payload);
}

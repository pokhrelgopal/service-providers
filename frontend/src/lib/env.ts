import { z } from "zod";

/**
 * Public, build-time env for the browser bundle. Only `NEXT_PUBLIC_*` vars are
 * available client-side, so they are validated here and re-exported typed.
 * Server-only secrets never belong in this file.
 */
const schema = z.object({
  // Optional: leave unset in dev so the API/socket host is derived from the
  // page hostname (so LAN & mobile access work). Set explicitly in production.
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAP_TILE_URL: z.string().url().optional(),
  // Self-hosted OSRM routing service (…/route/v1). Falls back to the public
  // OSRM demo server when unset — fine for dev, not for production.
  NEXT_PUBLIC_OSRM_URL: z.string().url().optional(),
});

/** Port the backend is served on (same host as the page in dev). */
const API_PORT = 5000;

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_MAP_TILE_URL: process.env.NEXT_PUBLIC_MAP_TILE_URL,
  NEXT_PUBLIC_OSRM_URL: process.env.NEXT_PUBLIC_OSRM_URL,
});

if (!parsed.success) {
  // Fail loudly during build/dev rather than shipping a misconfigured client.
  throw new Error(
    `Invalid public environment variables:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;

/**
 * Resolve the API base URL for browser requests:
 *  1. `NEXT_PUBLIC_API_URL` if set (production / explicit override).
 *  2. else derive from the page host on :5000 — so opening the app at
 *     `http://192.168.x.x:3000` calls `http://192.168.x.x:5000/api/v1`
 *     (LAN, mobile, another laptop all "just work").
 *  3. SSR fallback (server talks to itself).
 */
export function resolveApiUrl(): string {
  if (env.NEXT_PUBLIC_API_URL) return env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api/v1`;
  }
  return `http://localhost:${API_PORT}/api/v1`;
}

/** Same host derivation for the realtime socket (no `/api/v1` prefix). */
export function resolveSocketUrl(): string {
  if (env.NEXT_PUBLIC_SOCKET_URL) return env.NEXT_PUBLIC_SOCKET_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

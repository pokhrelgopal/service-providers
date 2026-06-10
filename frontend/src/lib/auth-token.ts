/**
 * Access token storage. The short-lived access token lives in localStorage so
 * it survives reloads; the rotating refresh token stays in an httpOnly cookie
 * the JS never touches. The axios interceptor refreshes transparently on 401.
 */
const KEY = "servio.accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** httpOnly cookie that carries the rotating refresh token. Scoped to the auth
 * routes so it's only sent where it's needed. */
export const REFRESH_COOKIE = 'refresh_token';

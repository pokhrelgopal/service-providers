import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "./env";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./auth-token";

/** Normalised error surfaced to the UI / TanStack Query. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
}

/**
 * True for errors where the server couldn't be reached or failed (not an auth
 * problem). Used to avoid bouncing the user to /login when the API is just down.
 */
export function isNetworkError(error: unknown): boolean {
  const e = error as Partial<ApiError> | null;
  if (!e || typeof e.status !== "number") return true; // no normalized status → treat as network
  return e.status === 0 || e.code === "NETWORK_ERROR" || e.status >= 500;
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as
      | { error?: { code?: string; message?: string | string[] } }
      | undefined;
    const rawMessage = body?.error?.message;
    return {
      status: error.response?.status ?? 0,
      code: body?.error?.code ?? "NETWORK_ERROR",
      message: Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : (rawMessage ?? error.message),
    };
  }
  return { status: 0, code: "UNKNOWN", message: "Something went wrong" };
}

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send the refresh cookie
});

// Attach the stored access token to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * POST /auth/refresh with a bare axios client (no interceptors → no recursion).
 * On success stores the new access token and returns it; on failure clears the
 * token and returns null.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<{ data: { accessToken: string } }>(
      `${env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data?.data?.accessToken;
    if (!token) throw new Error("No access token in refresh response");
    setAccessToken(token);
    return token;
  } catch {
    clearAccessToken();
    return null;
  }
}

// On 401, attempt a single silent refresh (deduped), then retry the request.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original as AxiosRequestConfig);
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { resolveApiUrl } from "@/lib/env";
import { clearAccessToken, getAccessToken } from "@/lib/auth-token";
import { isNetworkError } from "@/lib/axios";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
  deleteAccount as deleteAccountRequest,
} from "./api";

export const ME_QUERY_KEY = ["auth", "me"] as const;

/**
 * Current user via the backend self route. Only runs when an access token is
 * present (we never hit /auth/me anonymously). The axios interceptor refreshes
 * transparently if the token is expired.
 */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled: !!getAccessToken(),
    // Don't retry auth failures, but keep retrying while the server is
    // unreachable so we recover automatically once it's back.
    retry: (count, error) => isNetworkError(error) && count < 5,
    retryDelay: (count) => Math.min(1000 * 2 ** count, 8000),
    staleTime: 60_000,
  });
}

/**
 * Extends `useMe` with onboarding/role helpers. Onboarded = the user holds at
 * least one role (chosen during onboarding).
 */
export function useOnboarded() {
  const me = useMe();
  const roles = me.data?.roles ?? [];
  return {
    ...me,
    roles,
    isOnboarded: roles.length > 0,
    isSeeker: roles.includes("seeker"),
    isProvider: roles.includes("provider"),
    providerStatus: me.data?.providerStatus ?? null,
  };
}

/** Full-page navigation to the backend Google OAuth entrypoint. */
export function loginWithGoogleUrl(): string {
  return `${resolveApiUrl()}/auth/google`;
}

/** Email + password login. Refreshes `me`; the caller redirects on success. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      loginRequest(vars.email, vars.password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

/** Logs out the current device, clears token + cache, returns to /login. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearAccessToken();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

/** Logs out of every device, clears token + cache, returns to /login. */
export function useLogoutAll() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAllRequest,
    onSettled: () => {
      clearAccessToken();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

/**
 * Deletes the account, then clears token + cache and returns to /login. Uses
 * `onSuccess` (not `onSettled`) so a rejected delete — e.g. the user has a job
 * in progress — leaves them signed in to see the error.
 */
export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccountRequest,
    onSuccess: () => {
      clearAccessToken();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

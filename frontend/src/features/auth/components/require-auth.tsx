"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ConnectionError, FullScreenLoader } from "@/components/shared/spinner";
import { getAccessToken } from "@/lib/auth-token";
import { isNetworkError } from "@/lib/axios";
import { useMounted } from "@/hooks/use-mounted";
import { useMe } from "../hooks";
import type { UserRole } from "../schemas";

type Mode = "authed" | "onboarded" | "pending";

interface RequireAuthProps {
  children: ReactNode;
  /**
   * - `authed` — any authenticated user.
   * - `onboarded` (default) — authenticated + has a role, else → /onboarding.
   * - `pending` — authenticated + no role yet (onboarding screens), else → /dashboard.
   */
  mode?: Mode;
  requireRole?: UserRole;
  loginPath?: string;
  onboardingPath?: string;
  homePath?: string;
  roleFallback?: string;
}

/**
 * Client-side route protection. Authentication = a *successful* /auth/me — a
 * stored token alone is never enough. A real auth failure → /login; a network
 * error → a retry screen (never a redirect, which otherwise causes a
 * login↔dashboard loop while the API is down).
 */
export function RequireAuth({
  children,
  mode = "onboarded",
  requireRole,
  loginPath = "/login",
  onboardingPath = "/onboarding",
  homePath = "/dashboard",
  roleFallback = "/",
}: RequireAuthProps) {
  const router = useRouter();
  const mounted = useMounted();
  const hasToken = mounted && !!getAccessToken();
  const { data: user, isError, error, isLoading, refetch } = useMe();

  const authFailed = isError && !isNetworkError(error);
  const serverDown = isError && isNetworkError(error);

  // Only redirect for genuine "not authenticated" cases — never on a network error.
  const target = (() => {
    if (!mounted) return null;
    if (!hasToken || authFailed) return loginPath;
    if (!user) return null; // loading or server down
    const onboarded = user.roles.length > 0;
    if (mode === "onboarded" && !onboarded) return onboardingPath;
    if (mode === "pending" && onboarded) return homePath;
    if (requireRole && !user.roles.includes(requireRole)) return roleFallback;
    return null;
  })();

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (mounted && hasToken && serverDown && !user) {
    return <ConnectionError onRetry={() => void refetch()} />;
  }
  if (mounted && hasToken && !!user && !isError && !isLoading && !target) {
    return <>{children}</>;
  }
  return <FullScreenLoader label="Loading…" />;
}

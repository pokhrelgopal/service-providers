"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FullScreenLoader } from "@/components/shared/spinner";
import { refreshAccessToken } from "@/features/auth";

/**
 * Landing page after Google redirects back. The backend has set the refresh
 * cookie; we exchange it for an access token, then route into the app.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    void refreshAccessToken().then((token) => {
      router.replace(token ? "/dashboard" : "/login");
    });
  }, [router]);

  return <FullScreenLoader label="Signing you in…" />;
}

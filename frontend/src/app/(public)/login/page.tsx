"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/shared/container";
import { FullScreenLoader } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAccessToken } from "@/lib/auth-token";
import { useMounted } from "@/hooks/use-mounted";
import { GoogleIcon } from "@/components/svgs/google";
import { loginWithGoogleUrl, useMe } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const mounted = useMounted();
  const hasToken = mounted && !!getAccessToken();
  // Only treat the user as logged in if /auth/me actually succeeds.
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  // A stored token is being verified — wait for /auth/me before deciding.
  if (!mounted || (hasToken && isLoading) || user) {
    return <FullScreenLoader label="Checking your session…" />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/40">
      <Container className="flex max-w-md flex-col">
        <Card className="bg-card">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">Welcome to Servio</CardTitle>
            <CardDescription>
              Sign in to find trusted service providers near you — or offer your
              own service.
            </CardDescription>
          </CardHeader>
          <div className="px-6">
            <Button asChild size="lg" className="w-full">
              {/* Full-page navigation — OAuth can't go through fetch/XHR. */}
              <a href={loginWithGoogleUrl()}>
                <GoogleIcon className="size-5" />
                Continue with Google
              </a>
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing you agree to our terms and privacy policy.
            </p>
          </div>
        </Card>
      </Container>
    </main>
  );
}

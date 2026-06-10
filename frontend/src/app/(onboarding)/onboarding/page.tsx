"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchNormal1, Briefcase, ArrowRight2 } from "iconsax-reactjs";

import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { FullScreenLoader } from "@/components/shared/spinner";
import { RequireAuth, useOnboarded } from "@/features/auth";
import { useChooseSeeker } from "@/features/onboarding/hooks";

/** Role choice is only for users who haven't picked a path yet. */
export default function OnboardingPage() {
  return (
    <RequireAuth mode="pending">
      <RoleChoice />
    </RequireAuth>
  );
}

function RoleChoice() {
  const router = useRouter();
  const { providerStatus } = useOnboarded();
  const chooseSeeker = useChooseSeeker();

  // Already started the provider application → resume the wizard, skip the choice.
  useEffect(() => {
    if (providerStatus === "draft") router.replace("/onboarding/provider");
  }, [providerStatus, router]);

  if (providerStatus === "draft") {
    return <FullScreenLoader label="Resuming your application…" />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/40 py-12">
      <Container className="max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Eyebrow>Getting started</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How do you want to use Servio?
          </h1>
          <p className="max-w-md text-muted-foreground">
            Choose a path to continue. You can always add the other later.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Seeker */}
          <button
            type="button"
            onClick={() => chooseSeeker.mutate()}
            disabled={chooseSeeker.isPending}
            className="group flex flex-col items-start gap-4 rounded-2xl bg-white p-6 text-left transition-transform disabled:opacity-60"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SearchNormal1 size={26} variant="Bold" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">I&apos;m looking for help</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Find and book trusted providers near you.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
              {chooseSeeker.isPending ? "Setting up…" : "Continue as seeker"}
              <ArrowRight2 size={16} />
            </span>
          </button>

          {/* Provider */}
          <Link
            href="/onboarding/provider"
            className="group flex flex-col items-start gap-4 rounded-2xl bg-white p-6 text-left transition-transform hover:-translate-y-0.5"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase size={26} variant="Bold" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">I want to offer services</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Get verified and start receiving service requests.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
              Become a provider
              <ArrowRight2 size={16} />
            </span>
          </Link>
        </div>
      </Container>
    </main>
  );
}

"use client";

import Link from "next/link";
import { SearchNormal1 } from "iconsax-reactjs";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth";

/** Placeholder seeker home — the seeker experience is built in a later milestone. */
export default function SeekerHomePage() {
  const logout = useLogout();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50">
      <Container className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchNormal1 size={28} variant="Bold" />
        </span>
        <h1 className="text-2xl font-bold">You&apos;re all set as a seeker</h1>
        <p className="text-muted-foreground">
          Discovering nearby providers on the map is coming in an upcoming
          milestone. Hang tight!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={() => logout.mutate()}>
            Log out
          </Button>
          <Button asChild>
            <Link href="/onboarding/provider">Become Service Provider</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}

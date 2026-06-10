import { RequireAuth } from "@/features/auth";

/** Onboarding routes just require a logged-in user; per-page guards refine it
 * (role choice is pending-only; the provider wizard is open to seekers too). */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth mode="authed">{children}</RequireAuth>;
}

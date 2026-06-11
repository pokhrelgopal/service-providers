import { RequireAuth } from "@/features/auth";
import { ProviderMenu } from "@/components/provider/provider-menu";

/** Provider-only area: map-first, mobile-first. No sidebar — a floating
 * hamburger menu (present on every page) replaces it. */
export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requireRole="provider" roleFallback="/seeker">
      <div className="font-provider relative h-dvh w-full overflow-hidden">
        {children}
        <ProviderMenu />
      </div>
    </RequireAuth>
  );
}

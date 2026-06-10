import { RequireAuth } from "@/features/auth";
import { ProviderShell } from "@/components/provider/provider-shell";

/** Provider-only area: requires the provider role, wrapped in the dashboard shell. */
export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-provider">
      <RequireAuth requireRole="provider" roleFallback="/seeker">
        <ProviderShell>{children}</ProviderShell>
      </RequireAuth>
    </div>
  );
}

"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AvailabilityToggle } from "./availability-toggle";
import { PROVIDER_NAV } from "./provider-nav";

export function ProviderShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      brand={{ name: "Servio", subtitle: "Provider" }}
      nav={PROVIDER_NAV}
      profileHref="/profile"
      footerTop={<AvailabilityToggle />}
    >
      {children}
    </DashboardShell>
  );
}

"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV } from "./admin-nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      brand={{ name: "Servio", subtitle: "Admin" }}
      nav={[{ items: ADMIN_NAV }]}
    >
      {children}
    </DashboardShell>
  );
}

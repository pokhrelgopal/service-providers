import { RequireAuth } from "@/features/auth";
import { AdminShell } from "@/components/admin/admin-shell";

/** Admin-only area. Non-admins / signed-out users go to the admin login. */
export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth
      mode="authed"
      requireRole="admin"
      loginPath="/admin/login"
      roleFallback="/admin/login"
    >
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}

import { RequireAuth } from "@/features/auth";

/** Protected shell for the authenticated area. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

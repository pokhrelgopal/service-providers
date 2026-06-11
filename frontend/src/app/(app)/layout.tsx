import { RequireAuth } from "@/features/auth";
import { RealtimeConnector } from "@/features/realtime";
import { EngagementBubble } from "@/components/engagement/engagement-bubble";

/** Protected shell for the authenticated area. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RealtimeConnector />
      {children}
      <EngagementBubble />
    </RequireAuth>
  );
}

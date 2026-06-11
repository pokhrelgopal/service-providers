import { RequireAuth } from "@/features/auth";
import { RealtimeConnector } from "@/features/realtime";
import { CallProvider } from "@/features/calls";
import { CallOverlay } from "@/components/calls/call-overlay";
import { EngagementBar } from "@/components/engagement/engagement-bar";
import { LiveLocation } from "@/components/engagement/live-location";
import { ReviewPrompt } from "@/components/reviews/review-prompt";

/** Protected shell for the authenticated area. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RealtimeConnector />
      <CallProvider>
        {children}
        <EngagementBar />
        <LiveLocation />
        <ReviewPrompt />
        <CallOverlay />
      </CallProvider>
    </RequireAuth>
  );
}

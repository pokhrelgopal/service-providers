"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Messages1, TickCircle } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocketEvent } from "@/features/realtime";
import { INCOMING_KEY } from "@/features/requests";
import {
  useActiveEngagement,
  useCompleteEngagement,
  ACTIVE_ENGAGEMENT_KEY,
  messagesKey,
  type Engagement,
  type ChatMessage,
} from "@/features/engagements";

/** Persistent "Work active" bar (bottom) while an engagement is live. Opens the
 * full-page chat and — for the seeker — completes the job. Hidden on the chat
 * page itself. */
export function EngagementBar() {
  const qc = useQueryClient();
  const pathname = usePathname();
  const { data: engagement } = useActiveEngagement();
  const complete = useCompleteEngagement();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useSocketEvent("engagement:started", () => {
    qc.invalidateQueries({ queryKey: ACTIVE_ENGAGEMENT_KEY });
    qc.invalidateQueries({ queryKey: INCOMING_KEY });
  });

  useSocketEvent("engagement:ended", () => {
    qc.setQueryData(ACTIVE_ENGAGEMENT_KEY, null);
    qc.invalidateQueries({ queryKey: INCOMING_KEY });
  });

  useSocketEvent<{ engagementId: string; message: ChatMessage }>(
    "message:new",
    ({ engagementId, message }) => {
      qc.setQueryData<ChatMessage[]>(messagesKey(engagementId), (prev) =>
        prev ? [...prev, message] : prev,
      );
      // Don't flag unread if the user is already in this conversation.
      if (pathname !== `/chat/${engagementId}`) {
        qc.setQueryData<Engagement | null>(ACTIVE_ENGAGEMENT_KEY, (prev) =>
          prev ? { ...prev, unread: true } : prev,
        );
      }
    },
  );

  if (!engagement?.other) return null;
  // The chat page covers the bar; no need to render it there.
  if (pathname === `/chat/${engagement.id}`) return null;

  const other = engagement.other;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-7 z-1100 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10">
          {other.avatarUrl ? (
            <Image
              src={other.avatarUrl}
              alt={other.name}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
              {other.name.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-emerald-600 uppercase">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Work active
            </p>
            <p className="truncate font-semibold">{other.name}</p>
          </div>

          <Link
            href={`/chat/${engagement.id}`}
            aria-label="Open chat"
            className="text-foreground relative flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
          >
            <Messages1 size={20} />
            {engagement.unread && (
              <span className="absolute -top-0.5 -right-0.5 flex size-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-3.5 rounded-full bg-red-500 ring-2 ring-white" />
              </span>
            )}
          </Link>

          {engagement.role === "seeker" && (
            <Button
              size="sm"
              className="shrink-0 gap-1 rounded-full"
              onClick={() => setConfirmOpen(true)}
            >
              <TickCircle size={16} variant="Bold" />
              Done
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-4 rounded-full bg-green-100 p-2">
              <TickCircle
                size={32}
                variant="Bold"
                className="mx-auto rounded-full bg-green-100 text-green-600"
              />
            </div>
            <DialogTitle>Mark job as complete?</DialogTitle>
            <DialogDescription>
              This ends the chat and frees you both. It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto max-w-xl space-x-3">
            <Button
              variant="secondary"
              className="w-fit flex-1 rounded-full"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-fit flex-1 rounded-full"
              disabled={complete.isPending}
              onClick={() =>
                complete.mutate(engagement.id, {
                  onSuccess: () => setConfirmOpen(false),
                })
              }
            >
              {complete.isPending ? "Completing…" : "Yes, complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

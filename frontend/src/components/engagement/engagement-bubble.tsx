"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketEvent } from "@/features/realtime";
import { INCOMING_KEY } from "@/features/requests";
import {
  useActiveEngagement,
  useMarkRead,
  ACTIVE_ENGAGEMENT_KEY,
  messagesKey,
  type Engagement,
  type ChatMessage,
} from "@/features/engagements";
import { ChatPopup } from "./chat-popup";

/** Persistent chat-head: shows the active engagement's other person, top-right
 * on every page. Click to open the chat; a red ripple marks unread messages. */
export function EngagementBubble() {
  const qc = useQueryClient();
  const { data: engagement } = useActiveEngagement();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);

  useSocketEvent("engagement:started", () => {
    qc.invalidateQueries({ queryKey: ACTIVE_ENGAGEMENT_KEY });
    // This provider is now busy → drop any raised hands from their map.
    qc.invalidateQueries({ queryKey: INCOMING_KEY });
  });

  useSocketEvent("engagement:ended", () => {
    qc.setQueryData(ACTIVE_ENGAGEMENT_KEY, null);
    setOpen(false);
    // Freed → refresh incoming requests on the map.
    qc.invalidateQueries({ queryKey: INCOMING_KEY });
  });

  useSocketEvent<{ engagementId: string; message: ChatMessage }>(
    "message:new",
    ({ engagementId, message }) => {
      qc.setQueryData<ChatMessage[]>(messagesKey(engagementId), (prev) =>
        prev ? [...prev, message] : prev,
      );
      if (open) {
        markRead.mutate(engagementId);
      } else {
        qc.setQueryData<Engagement | null>(ACTIVE_ENGAGEMENT_KEY, (prev) =>
          prev ? { ...prev, unread: true } : prev,
        );
      }
    },
  );

  if (!engagement?.other) return null;

  function openChat() {
    setOpen(true);
    markRead.mutate(engagement!.id);
    qc.setQueryData<Engagement | null>(ACTIVE_ENGAGEMENT_KEY, (prev) =>
      prev ? { ...prev, unread: false } : prev,
    );
  }

  const other = engagement.other;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label={`Chat with ${other.name}`}
          className="fixed right-4 top-4 z-[1100] flex size-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95"
        >
          {other.avatarUrl ? (
            <Image
              src={other.avatarUrl}
              alt={other.name}
              width={56}
              height={56}
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {other.name.charAt(0).toUpperCase()}
            </span>
          )}
          {engagement.unread && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-4 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          )}
        </button>
      )}

      {open && <ChatPopup engagement={engagement} onClose={() => setOpen(false)} />}
    </>
  );
}

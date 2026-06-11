"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Send, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMessages,
  useSendMessage,
  useCompleteEngagement,
  type Engagement,
} from "@/features/engagements";

export function ChatPopup({
  engagement,
  onClose,
}: {
  engagement: Engagement;
  onClose: () => void;
}) {
  const { data: messages } = useMessages(engagement.id);
  const send = useSendMessage(engagement.id);
  const complete = useCompleteEngagement();
  const [text, setText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    send.mutate(body, { onSuccess: () => setText("") });
  }

  const other = engagement.other;

  return (
    <div className="fixed bottom-4 right-4 z-[1100] flex h-[28rem] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b p-3">
        {other?.avatarUrl ? (
          <Image
            src={other.avatarUrl}
            alt={other.name}
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {(other?.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <p className="min-w-0 flex-1 truncate font-semibold">{other?.name}</p>
        {engagement.role === "seeker" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 rounded-full px-3"
            disabled={complete.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Check size={14} />
            Done
          </Button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {!messages || messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Say hello and describe what you need 👋
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <span
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  m.mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-neutral-100 text-foreground",
                )}
              >
                {m.body}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex items-center gap-2 border-t p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full bg-neutral-100 px-3.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button
          type="submit"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          disabled={!text.trim() || send.isPending}
          aria-label="Send"
        >
          <Send size={16} />
        </Button>
      </form>

      {/* Complete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark job as complete?</DialogTitle>
            <DialogDescription>
              This ends the chat and frees you both. It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={complete.isPending}
              onClick={() =>
                complete.mutate(engagement.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    onClose();
                  },
                })
              }
            >
              {complete.isPending ? "Completing…" : "Yes, complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

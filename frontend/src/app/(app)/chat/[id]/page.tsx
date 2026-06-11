"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft2, Call, Gallery, Send2 } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { formatDay, formatTime } from "@/lib/format";
import { useSocketEvent, useConnectionState } from "@/features/realtime";
import { useCall } from "@/features/calls";
import {
  useActiveEngagement,
  useMessages,
  useSendMessage,
  useSendImage,
  useMarkRead,
  messagesKey,
  ACTIVE_ENGAGEMENT_KEY,
  type Engagement,
  type ChatMessage,
} from "@/features/engagements";

const ACCEPT = "image/png,image/jpeg,image/webp";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: engagement } = useActiveEngagement();
  const { data: messages } = useMessages(id);
  const send = useSendMessage(id);
  const sendImage = useSendImage(id);
  const markRead = useMarkRead();
  const connection = useConnectionState();
  const call = useCall();

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mark read on open + clear the unread badge.
  useEffect(() => {
    markRead.mutate(id);
    qc.setQueryData<Engagement | null>(ACTIVE_ENGAGEMENT_KEY, (prev) =>
      prev ? { ...prev, unread: false } : prev,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep it read while viewing.
  useSocketEvent("message:new", () => markRead.mutate(id));

  // Re-sync on (re)connect. While the socket was down we may have missed
  // `message:new` pushes, so refetch the thread from the server — this closes
  // the "messages sent during a drop never appear" gap. Fires on the initial
  // connect and on every reconnect.
  useSocketEvent("connect", () => {
    qc.invalidateQueries({ queryKey: messagesKey(id) });
    markRead.mutate(id);
  });

  // Scroll to the latest message — after paint so the full height (and any
  // just-rendered messages) is measured correctly on load.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [messages]);

  function goBack() {
    router.push(engagement?.role === "provider" ? "/dashboard" : "/seeker");
  }

  if (!engagement || engagement.id !== id || !engagement.other) {
    return (
      <div className="fixed inset-0 z-1150 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-muted-foreground">This conversation has ended.</p>
        <button
          type="button"
          onClick={() => router.push("/seeker")}
          className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  const other = engagement.other;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText(""); // clear immediately; the optimistic bubble shows the text
    send.mutate({ body, tempId: crypto.randomUUID() });
  }

  // Re-send a message that failed (e.g. sent during an internet drop): drop the
  // failed bubble and send it again as a fresh optimistic message.
  function retry(failed: ChatMessage) {
    if (!failed.body) return;
    qc.setQueryData<ChatMessage[]>(messagesKey(id), (prev) =>
      (prev ?? []).filter((m) => m.id !== failed.id),
    );
    send.mutate({ body: failed.body, tempId: crypto.randomUUID() });
  }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) sendImage.mutate(file);
  }

  return (
    <div className="fixed inset-0 z-1150 flex flex-col bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2.5">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="text-foreground flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <ArrowLeft2 size={22} />
        </button>
        {other.avatarUrl ? (
          <Image
            src={other.avatarUrl}
            alt={other.name}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold">
            {other.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{other.name}</p>
          <p className="text-xs text-emerald-600">Active job</p>
        </div>
        <button
          type="button"
          onClick={call.startCall}
          disabled={call.status !== "idle"}
          aria-label="Call"
          className="text-foreground flex size-10 cursor-pointer items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50"
        >
          <Call size={20} />
        </button>
      </header>

      {/* Connection banner — shown while the device is offline or the socket is
          reconnecting, so a silent drop is visible to the user. */}
      {connection !== "online" && (
        <div
          className={cn(
            "shrink-0 px-4 py-1.5 text-center text-xs font-medium",
            connection === "offline"
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-100 text-amber-700",
          )}
        >
          {connection === "offline"
            ? "No internet connection"
            : "Reconnecting…"}
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {!messages || messages.length === 0 ? (
          <p className="text-muted-foreground pt-12 text-center text-sm">
            Say hello and describe what you need. You can attach a photo too 📷
          </p>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay =
              !prev ||
              new Date(prev.createdAt).toDateString() !==
                new Date(m.createdAt).toDateString();
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="text-muted-foreground rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatDay(m.createdAt)}
                    </span>
                  </div>
                )}
                <MessageRow
                  message={m}
                  avatar={other.avatarUrl}
                  onRetry={retry}
                />
              </div>
            );
          })
        )}
        {sendImage.isPending && (
          <div className="flex justify-end">
            <div className="size-40 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-2 border-t p-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={pickImage}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sendImage.isPending}
          aria-label="Attach image"
          className="text-muted-foreground flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-50"
        >
          <Gallery size={22} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="focus-visible:ring-ring/40 h-11 flex-1 rounded-full bg-neutral-100 px-4 text-sm outline-none focus-visible:ring-2"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          aria-label="Send"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:opacity-50"
        >
          <Send2 size={20} variant="Bold" />
        </button>
      </form>
    </div>
  );
}

function MessageRow({
  message,
  avatar,
  onRetry,
}: {
  message: ChatMessage;
  avatar: string | null;
  onRetry: (message: ChatMessage) => void;
}) {
  const mine = message.mine;
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        mine ? "justify-end" : "justify-start",
      )}
    >
      {!mine &&
        (avatar ? (
          <Image
            src={avatar}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="bg-primary/10 size-7 shrink-0 rounded-full" />
        ))}
      <div className={cn("max-w-[75%]", mine && "items-end")}>
        <p
          className={cn(
            "text-muted-foreground mb-0.5 text-[10px]",
            mine ? "text-right" : "text-left",
          )}
        >
          {message.status === "sending"
            ? "Sending…"
            : formatTime(message.createdAt)}
        </p>
        {message.imageUrl ? (
          <a
            href={message.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-2xl bg-neutral-100"
          >
            <Image
              src={message.imageUrl}
              alt="Shared photo"
              width={240}
              height={240}
              className="h-auto max-h-72 w-60 object-cover"
            />
          </a>
        ) : (
          <span
            className={cn(
              "inline-block rounded-2xl px-3.5 py-2 text-sm",
              mine
                ? "bg-primary text-primary-foreground"
                : "text-foreground bg-neutral-100",
              message.status === "sending" && "opacity-60",
            )}
          >
            {message.body}
          </span>
        )}
        {message.status === "failed" && (
          <p className="text-destructive mt-0.5 text-right text-[10px]">
            Not delivered ·{" "}
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="cursor-pointer font-semibold underline"
            >
              Retry
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

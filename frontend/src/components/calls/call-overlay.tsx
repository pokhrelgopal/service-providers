"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Call, CallSlash, Microphone2, MicrophoneSlash1 } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { useCall } from "@/features/calls";

/** Global full-screen call UI. Renders nothing when idle. Shows the ringing,
 * connecting, and in-call states for audio calls. Mounted once in the app
 * layout so it can appear over any screen. */
export function CallOverlay() {
  const call = useCall();

  if (call.status === "idle") return null;

  const { status, peerName, peerAvatar, reconnecting, endReason } = call;
  const name = peerName ?? "Contact";

  const END_TEXT: Record<string, string> = {
    declined: "Call declined",
    missed: "No answer",
    failed: "Call failed",
    ended: "Call ended",
  };

  const subtitle =
    status === "ended" ? (
      END_TEXT[endReason ?? "ended"]
    ) : status === "incoming" ? (
      "Incoming call"
    ) : status === "calling" ? (
      "Calling…"
    ) : status === "connecting" ? (
      "Connecting…"
    ) : reconnecting ? (
      "Reconnecting…"
    ) : (
      <CallTimer startedAt={call.startedAt} />
    );

  return (
    <div className="fixed inset-0 z-2000 flex flex-col items-center justify-between bg-neutral-900 px-6 py-16 text-white">
      {/* Who */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        {peerAvatar ? (
          <Image
            src={peerAvatar}
            alt={name}
            width={112}
            height={112}
            className={cn(
              "size-28 rounded-full object-cover ring-4 ring-white/10",
              (status === "incoming" || status === "calling") &&
                "animate-pulse",
            )}
          />
        ) : (
          <span className="flex size-28 items-center justify-center rounded-full bg-white/10 text-4xl font-semibold ring-4 ring-white/10">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        </div>
      </div>

      {/* Controls — none on the brief "ended" screen. */}
      <div className="flex h-16 items-center gap-6">
        {status === "ended" ? null : status === "incoming" ? (
          <>
            <ControlButton
              label="Decline"
              onClick={call.decline}
              className="bg-red-500 hover:bg-red-600"
            >
              <CallSlash size={28} variant="Bold" />
            </ControlButton>
            <ControlButton
              label="Accept"
              onClick={call.accept}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Call size={28} variant="Bold" />
            </ControlButton>
          </>
        ) : (
          <>
            {status === "active" && (
              <ControlButton
                label={call.muted ? "Unmute" : "Mute"}
                onClick={call.toggleMute}
                className={cn(
                  "bg-white/15 hover:bg-white/25",
                  call.muted && "bg-white text-neutral-900 hover:bg-white/90",
                )}
              >
                {call.muted ? (
                  <MicrophoneSlash1 size={26} variant="Bold" />
                ) : (
                  <Microphone2 size={26} variant="Bold" />
                )}
              </ControlButton>
            )}
            <ControlButton
              label="Hang up"
              onClick={call.hangUp}
              className="bg-red-500 hover:bg-red-600"
            >
              <CallSlash size={28} variant="Bold" />
            </ControlButton>
          </>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-16 cursor-pointer items-center justify-center rounded-full text-white transition-colors active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** mm:ss timer counting up from when the call connected. */
function CallTimer({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!startedAt) return <>Connected</>;
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return (
    <>
      {mm}:{ss}
    </>
  );
}

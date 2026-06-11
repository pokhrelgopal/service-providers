"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import { emitSocket } from "@/lib/socket";
import { startRing, stopRing } from "@/lib/ringer";
import { useSocketEvent } from "@/features/realtime";
import { useActiveEngagement } from "@/features/engagements";
import { fetchIceServers } from "./ice";
import type {
  CallStatus,
  EndReason,
  IceSignal,
  SdpSignal,
  SignalBase,
} from "./types";

const RING_TIMEOUT_MS = 30_000;
// How long we tolerate a broken media path (while trying to recover) before
// giving up and ending the call.
const RECONNECT_GRACE_MS = 15_000;
// How long the "Call ended / declined / …" screen lingers before going idle.
const ENDED_LINGER_MS = 3_000;

interface CallContextValue {
  status: CallStatus;
  muted: boolean;
  /** Media path is broken and we're trying to recover (mid-call). */
  reconnecting: boolean;
  endReason: EndReason | null;
  peerName: string | null;
  peerAvatar: string | null;
  startedAt: number | null;
  startCall: () => void;
  accept: () => void;
  decline: () => void;
  hangUp: () => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within <CallProvider>");
  return ctx;
}

/**
 * The call engine: a small state machine wrapping a single `RTCPeerConnection`.
 * The Socket.IO connection is used only for signaling; once connected, audio is
 * peer-to-peer. Mounted once, globally, so an incoming call can ring on any
 * screen. See docs/calling-feature.md.
 */
export function CallProvider({ children }: { children: React.ReactNode }) {
  const { data: engagement } = useActiveEngagement();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Mutable call session — kept in refs so async socket handlers read live values.
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iceRef = useRef<RTCIceServer[] | null>(null);
  const callIdRef = useRef<string | null>(null);
  const engIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false); // only the caller re-offers on ICE restart
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- timers ----

  function clearRingTimer() {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }
  function clearFailTimer() {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  }
  function armFailTimer() {
    if (failTimerRef.current) return; // already counting down
    failTimerRef.current = setTimeout(
      () => finish("failed"),
      RECONNECT_GRACE_MS,
    );
  }

  // ---- teardown ----

  function cleanup() {
    clearRingTimer();
    clearFailTimer();
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    pendingIceRef.current = [];
    callIdRef.current = null;
    engIdRef.current = null;
    isCallerRef.current = false;
    setMuted(false);
    setReconnecting(false);
    setStartedAt(null);
  }

  /** Show a brief "why it ended" screen, then return to idle. Used for both
   * sides — the one who hung up/declined sees it too. */
  function finish(reason: EndReason) {
    cleanup();
    setEndReason(reason);
    setStatus("ended");
    if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
    endedTimerRef.current = setTimeout(() => {
      setEndReason(null);
      setStatus("idle");
    }, ENDED_LINGER_MS);
  }

  // ---- signaling + media helpers ----

  function signal(event: string, extra?: Record<string, unknown>) {
    if (!callIdRef.current || !engIdRef.current) return;
    emitSocket(event, {
      engagementId: engIdRef.current,
      callId: callIdRef.current,
      ...extra,
    });
  }

  async function ensureIce(): Promise<RTCIceServer[]> {
    if (!iceRef.current) iceRef.current = await fetchIceServers();
    return iceRef.current;
  }

  async function getMic(): Promise<MediaStream> {
    if (!localRef.current) {
      localRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }
    return localRef.current;
  }

  async function createPeer(): Promise<RTCPeerConnection> {
    const iceServers = await ensureIce();
    const pc = new RTCPeerConnection({ iceServers });
    const stream = await getMic();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (ev) => {
      if (ev.candidate)
        signal("call:ice", { candidate: ev.candidate.toJSON() });
    };
    pc.ontrack = (ev) => {
      if (audioRef.current) audioRef.current.srcObject = ev.streams[0];
    };
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        // (Re)connected — mark active and stop any recovery countdown.
        clearRingTimer();
        clearFailTimer();
        setReconnecting(false);
        setStatus("active");
        setStartedAt((prev) => prev ?? Date.now());
      } else if (state === "disconnected") {
        // Often transient — show "Reconnecting…" and start the grace timer.
        setReconnecting(true);
        armFailTimer();
      } else if (state === "failed") {
        // Path is dead — the caller renegotiates (ICE restart) to recover.
        setReconnecting(true);
        void restartIce();
        armFailTimer();
      }
    };

    pcRef.current = pc;
    return pc;
  }

  async function drainPendingIce(pc: RTCPeerConnection) {
    const queued = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of queued) {
      await pc.addIceCandidate(candidate).catch(() => {});
    }
  }

  /** Mid-call recovery: the caller creates a fresh offer with new ICE so the
   * two peers can find a new network path without dropping the call. */
  async function restartIce() {
    const pc = pcRef.current;
    if (!pc || !isCallerRef.current) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      signal("call:offer", { sdp: offer });
    } catch {
      // Best effort; the fail timer will end the call if this doesn't recover.
    }
  }

  function armRingTimeout() {
    clearRingTimer();
    ringTimerRef.current = setTimeout(() => {
      signal("call:end");
      finish("missed");
    }, RING_TIMEOUT_MS);
  }

  // ---- public actions ----

  function startCall() {
    if (status !== "idle" || !engagement?.id || !engagement.other) return;
    callIdRef.current = crypto.randomUUID();
    engIdRef.current = engagement.id;
    isCallerRef.current = true;
    setStatus("calling");
    void (async () => {
      try {
        await ensureIce();
        await getMic(); // prompt for mic up front
      } catch {
        finish("failed");
        return;
      }
      signal("call:invite");
      armRingTimeout();
    })();
  }

  function accept() {
    if (status !== "incoming") return;
    isCallerRef.current = false;
    setStatus("connecting");
    clearRingTimer();
    void (async () => {
      try {
        await createPeer();
      } catch {
        decline();
        return;
      }
      signal("call:accept");
    })();
  }

  function decline() {
    signal("call:decline");
    finish("declined");
  }

  function hangUp() {
    signal("call:end");
    finish("ended");
  }

  function toggleMute() {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  // ---- signaling listeners ----

  useSocketEvent<SignalBase>("call:invite", (data) => {
    if (status !== "idle") {
      // Busy — politely reject this specific call.
      emitSocket("call:end", {
        engagementId: data.engagementId,
        callId: data.callId,
      });
      return;
    }
    callIdRef.current = data.callId;
    engIdRef.current = data.engagementId;
    isCallerRef.current = false;
    setStatus("incoming");
    armRingTimeout();
  });

  useSocketEvent<SignalBase>("call:accept", (data) => {
    if (callIdRef.current !== data.callId) return;
    clearRingTimer();
    setStatus("connecting");
    void (async () => {
      const pc = await createPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signal("call:offer", { sdp: offer });
    })();
  });

  useSocketEvent<SdpSignal>("call:offer", (data) => {
    if (callIdRef.current !== data.callId) return;
    void (async () => {
      const pc = pcRef.current;
      if (!pc) return; // offers only arrive once our peer exists
      await pc.setRemoteDescription(data.sdp);
      await drainPendingIce(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal("call:answer", { sdp: answer });
    })();
  });

  useSocketEvent<SdpSignal>("call:answer", (data) => {
    if (callIdRef.current !== data.callId) return;
    void (async () => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(data.sdp);
      await drainPendingIce(pc);
    })();
  });

  useSocketEvent<IceSignal>("call:ice", (data) => {
    if (callIdRef.current !== data.callId) return;
    const pc = pcRef.current;
    if (pc?.remoteDescription) {
      void pc.addIceCandidate(data.candidate).catch(() => {});
    } else {
      pendingIceRef.current.push(data.candidate);
    }
  });

  useSocketEvent<SignalBase>("call:decline", (data) => {
    if (callIdRef.current === data.callId) finish("declined");
  });

  useSocketEvent<SignalBase>("call:end", (data) => {
    if (callIdRef.current === data.callId) finish("ended");
  });

  // Ringback / ringtone while a call is ringing on either side. Uses the
  // stoppable Web Audio ringer so it goes silent the instant we leave the
  // ringing state (accept / decline / end) — no lingering clip.
  useEffect(() => {
    if (status === "calling" || status === "incoming") startRing();
    else stopRing();
    return () => stopRing();
  }, [status]);

  // Tear down on unmount only (cleanup touches refs/state, which are stable).
  useEffect(() => {
    return () => {
      if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: CallContextValue = {
    status,
    muted,
    reconnecting,
    endReason,
    peerName: engagement?.other?.name ?? null,
    peerAvatar: engagement?.other?.avatarUrl ?? null,
    startedAt,
    startCall,
    accept,
    decline,
    hangUp,
    toggleMute,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* Hidden sink for the remote audio stream. */}
      <audio ref={audioRef} autoPlay hidden />
    </CallContext.Provider>
  );
}

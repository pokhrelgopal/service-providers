/** The call lifecycle. See docs/calling-feature.md §5 for the full diagram.
 *  - idle        — no call
 *  - calling     — we invited someone, waiting for them to pick up (ringback)
 *  - incoming    — someone is calling us (ringing)
 *  - connecting  — accepted; WebRTC handshake in progress
 *  - active      — media connected, talking
 *  - ended       — brief "why it ended" screen before returning to idle
 */
export type CallStatus =
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";

/** Why a call ended — drives the short end-screen message. */
export type EndReason = "declined" | "missed" | "ended" | "failed";

/** Every signaling message names its engagement + a per-call id. */
export interface SignalBase {
  engagementId: string;
  callId: string;
  from?: string;
}

export interface SdpSignal extends SignalBase {
  sdp: RTCSessionDescriptionInit;
}

export interface IceSignal extends SignalBase {
  candidate: RTCIceCandidateInit;
}

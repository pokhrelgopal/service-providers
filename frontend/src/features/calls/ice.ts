import { api } from "@/lib/axios";

/** Fetch the ICE servers (STUN + short-lived TURN creds) the browser needs to
 * build an `RTCPeerConnection`. Minted per-request by the backend. */
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  const res = await api.get("/calls/ice-servers");
  return (res.data?.data?.iceServers ?? []) as RTCIceServer[];
}

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { emitSocket } from "@/lib/socket";
import { distanceMeters } from "@/lib/geo";
import { useSocketEvent } from "@/features/realtime";
import {
  useActiveEngagement,
  LIVE_LOCATION_KEY,
  LIVE_ROUTE_KEY,
  type LiveLocation as LiveLoc,
} from "@/features/engagements";

// Throttle the provider's GPS stream — plenty for "is he on the way".
const MIN_INTERVAL_MS = 4000;
const MIN_DISTANCE_M = 15;
// Re-route far less often than the marker moves.
const ROUTE_MIN_MS = 20_000;
const ROUTE_MIN_M = 150;

/** While engaged, the provider streams their GPS (throttled); both parties join
 * the engagement room and store the other's incoming location. Mount once. */
export function LiveLocation() {
  const qc = useQueryClient();
  const { data: engagement } = useActiveEngagement();
  const isProvider = engagement?.role === "provider";
  const engagementId = engagement?.id;

  // Join the engagement room (validated server-side once) — on mount + on
  // every (re)connect, since rooms don't survive a socket reconnect.
  useEffect(() => {
    if (engagementId) emitSocket("engagement:join", { engagementId });
  }, [engagementId]);
  useSocketEvent(
    "connect",
    () => {
      if (engagementId) emitSocket("engagement:join", { engagementId });
    },
    !!engagementId,
  );

  // Receive the other party's live location → move the marker every ping, but
  // only refresh the route point occasionally (throttled in this handler, not
  // an effect — avoids cascading re-renders).
  const lastRoute = useRef<{ t: number; p: [number, number] } | null>(null);
  useSocketEvent<LiveLoc>("engagement:location", (loc) => {
    qc.setQueryData(LIVE_LOCATION_KEY, loc);
    const now = Date.now();
    const p: [number, number] = [loc.lat, loc.lng];
    const prev = lastRoute.current;
    if (
      !prev ||
      now - prev.t > ROUTE_MIN_MS ||
      distanceMeters(prev.p, p) > ROUTE_MIN_M
    ) {
      lastRoute.current = { t: now, p };
      qc.setQueryData(LIVE_ROUTE_KEY, loc);
    }
  });

  // Provider broadcasts their position as they move (throttled).
  const last = useRef<{ t: number; p: [number, number] } | null>(null);
  useEffect(() => {
    if (!isProvider || !engagementId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    last.current = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const now = Date.now();
        const prev = last.current;
        if (
          prev &&
          now - prev.t < MIN_INTERVAL_MS &&
          distanceMeters(prev.p, p) < MIN_DISTANCE_M
        ) {
          return;
        }
        last.current = { t: now, p };
        emitSocket("location:update", { engagementId, lat: p[0], lng: p[1] });
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isProvider, engagementId]);

  // Drop stale location once the engagement ends.
  useEffect(() => {
    if (!engagement) {
      lastRoute.current = null;
      qc.setQueryData(LIVE_LOCATION_KEY, null);
      qc.setQueryData(LIVE_ROUTE_KEY, null);
    }
  }, [engagement, qc]);

  return null;
}

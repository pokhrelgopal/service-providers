"use client";

import { useCallback, useState } from "react";

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

/** One-shot device geolocation. Call `request()` (e.g. on a button) to prompt. */
export function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback((onSuccess?: (coords: GeoCoords) => void) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: GeoCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(next);
        setLoading(false);
        onSuccess?.(next);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it to continue."
            : "Couldn't get your location. Try again.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  return { coords, error, loading, request };
}

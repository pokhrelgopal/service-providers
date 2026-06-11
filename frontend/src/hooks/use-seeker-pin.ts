"use client";

import { useCallback, useState } from "react";

const PIN_KEY = "servio.seekerPin";
export const KATHMANDU: [number, number] = [27.7172, 85.324];

function readPin(): [number, number] {
  if (typeof window === "undefined") return KATHMANDU;
  try {
    const v = window.localStorage.getItem(PIN_KEY);
    if (!v) return KATHMANDU;
    const p = JSON.parse(v) as [number, number];
    return [p[0], p[1]];
  } catch {
    return KATHMANDU;
  }
}

function savePin(p: [number, number]): void {
  try {
    window.localStorage.setItem(PIN_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

/** Seeker's published map point, persisted to localStorage (defaults to KTM). */
export function useSeekerPin() {
  const [pin, setPinState] = useState<[number, number]>(() => readPin());
  const setPin = useCallback((lat: number, lng: number) => {
    const p: [number, number] = [lat, lng];
    setPinState(p);
    savePin(p);
  }, []);
  return { pin, setPin };
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Location, SearchNormal1, CloseCircle, Star1 } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FullScreenLoader } from "@/components/shared/spinner";
import { ServiceMap } from "@/components/map";
import { ProviderDetailDialog } from "@/components/seeker/provider-detail-dialog";
import { useMounted } from "@/hooks/use-mounted";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useSkills } from "@/features/providers";
import { useNearbyProviders, type ProviderCard } from "@/features/discovery";
import { useSocketEvent } from "@/features/realtime";
import {
  useMyRequest,
  useCreateRequest,
  useCancelRequest,
  MY_REQUEST_KEY,
} from "@/features/requests";
import { useAcceptProvider } from "@/features/engagements";
import { playAppSound, SOUND } from "@/lib/sounds";

const PIN_KEY = "servio.seekerPin";
const KATHMANDU: [number, number] = [27.7172, 85.324];

const RADIUS_OPTIONS = [
  { value: 1000, label: "1 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

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
function savePin(p: [number, number]) {
  try {
    window.localStorage.setItem(PIN_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

function formatDistance(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Stable dummy rating (4.0–4.9) from an id, until real reviews land. */
function dummyRating(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (4 + (h % 10) / 10).toFixed(1);
}

const chip = (active: boolean) =>
  active
    ? "cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
    : "cursor-pointer rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70";

export default function SeekerPage() {
  const mounted = useMounted();
  if (!mounted) return <FullScreenLoader label="Loading map…" />;
  return <SeekerDiscovery />;
}

function SeekerDiscovery() {
  const qc = useQueryClient();
  const geo = useGeolocation();
  const { data: skills } = useSkills();
  const { data: myRequest } = useMyRequest();
  const createRequest = useCreateRequest();
  const cancelRequest = useCancelRequest();
  const acceptProvider = useAcceptProvider();

  const [pin, setPin] = useState<[number, number]>(() => readPin());
  const [searchOpen, setSearchOpen] = useState(false);
  const [range, setRange] = useState(5000);
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<ProviderCard | null>(null);
  const [respondersOpen, setRespondersOpen] = useState(false);

  const active = myRequest ?? null;

  // Live: a provider offered (or withdrew) → refresh responders.
  useSocketEvent("request:response", () => {
    qc.invalidateQueries({ queryKey: MY_REQUEST_KEY });
    void playAppSound(SOUND.offerReceived);
  });
  useSocketEvent("request:response-removed", () => {
    qc.invalidateQueries({ queryKey: MY_REQUEST_KEY });
  });

  // Auto-clear the request from view when it expires (server stops serving it).
  useEffect(() => {
    if (!active) return;
    const ms = new Date(active.expiresAt).getTime() - Date.now();
    const t = setTimeout(
      () => qc.invalidateQueries({ queryKey: MY_REQUEST_KEY }),
      Math.max(0, ms),
    );
    return () => clearTimeout(t);
  }, [active, qc]);

  const center: [number, number] = active
    ? [active.latitude, active.longitude]
    : pin;

  // Matching providers (only while a broadcast is live).
  const { data: providers } = useNearbyProviders(
    active
      ? {
          lat: active.latitude,
          lng: active.longitude,
          radius: active.radius,
          skill: active.skill?.slug,
        }
      : null,
  );

  function locateMe() {
    geo.request((c) => updatePin(c.latitude, c.longitude));
  }
  function updatePin(lat: number, lng: number) {
    const p: [number, number] = [lat, lng];
    setPin(p);
    savePin(p);
  }

  function submitSearch() {
    if (!service || description.trim().length < 5) return;
    createRequest.mutate(
      {
        skill: service,
        description: description.trim(),
        latitude: pin[0],
        longitude: pin[1],
        radius: range,
      },
      { onSuccess: () => setSearchOpen(false) },
    );
  }

  const responders = active?.responders ?? [];

  return (
    <>
      {/* Map */}
      <div className="absolute inset-0">
        <ServiceMap
          center={center}
          zoom={active ? 14 : 13}
          zoomControl={false}
          pin={center}
          ripple={active ? center : undefined}
          onPinChange={active ? undefined : updatePin}
          providers={(providers ?? [])
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({
              id: p.id,
              latitude: p.latitude!,
              longitude: p.longitude!,
              name: p.name,
              onSelect: () => setSelected(p),
            }))}
        />
      </div>

      {/* Active broadcast banner — bottom slot (shares the spot with the
          "Need a hand?" button; only one renders at a time). */}
      {active && (
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-1000 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
            <span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
              <span className="bg-primary size-2.5 animate-pulse rounded-full" />
            </span>
            <button
              type="button"
              onClick={() => responders.length && setRespondersOpen(true)}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <p className="truncate text-sm font-semibold">
                Looking for {active.skill?.name ?? "help"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {responders.length === 0
                  ? "Broadcasting to nearby providers…"
                  : `${responders.length} provider${responders.length > 1 ? "s" : ""} can help — tap to view`}
              </p>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive shrink-0"
              onClick={() => cancelRequest.mutate(active.id)}
              disabled={cancelRequest.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bottom-center: start a search (only when idle) */}
      {!active && (
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-1000 flex justify-center px-4">
          <Button
            onClick={() => setSearchOpen(true)}
            className="pointer-events-auto h-14 rounded-full px-8 text-lg! font-semibold shadow-xl"
          >
            Need a hand?
          </Button>
        </div>
      )}

      {/* Bottom-right: locate me (only when idle) */}
      {!active && (
        <button
          type="button"
          onClick={locateMe}
          disabled={geo.loading}
          aria-label="Use my current location"
          className="text-primary absolute right-5 bottom-7 z-1000 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          <Location size={22} variant={geo.loading ? "Linear" : "Bold"} />
        </button>
      )}

      {/* Search / broadcast dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find help near you</DialogTitle>
            <DialogDescription>
              Describe what you need. We&apos;ll broadcast it to matching
              providers around your pin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="space-y-2">
              <p className="text-sm font-medium">Service</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {skills?.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setService(s.slug)}
                    className={chip(service === s.slug)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Distance</p>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRange(opt.value)}
                    className={chip(range === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Describe the problem</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="e.g. My kitchen sink is leaking under the cabinet and needs urgent repair."
                className="border-input focus-visible:ring-ring/50 w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              />
            </div>

            {createRequest.isError && (
              <p className="text-destructive text-sm">
                Couldn&apos;t broadcast — please try again.
              </p>
            )}
          </div>

          <Button
            onClick={submitSearch}
            disabled={
              !service ||
              description.trim().length < 5 ||
              createRequest.isPending
            }
            className="w-full gap-2"
          >
            <SearchNormal1 size={18} />
            {createRequest.isPending ? "Broadcasting…" : "Search"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Responders */}
      <Dialog open={respondersOpen} onOpenChange={setRespondersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Providers who can help</DialogTitle>
            <DialogDescription>
              These providers offered to help with your request.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 space-y-2 overflow-y-auto py-1">
            {responders.length === 0 ? (
              <li className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
                <CloseCircle size={28} />
                <p className="text-sm">No responders yet.</p>
              </li>
            ) : (
              responders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3"
                >
                  {r.provider?.avatarUrl ? (
                    <Image
                      src={r.provider.avatarUrl}
                      alt={r.provider.name}
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full font-semibold">
                      {(r.provider?.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {r.provider?.name ?? "Provider"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star1 size={13} variant="Bold" className="text-amber-400" />
                      {dummyRating(r.provider?.id ?? r.id)}
                      {r.distanceMeters != null && (
                        <span className="ml-1">
                          · {formatDistance(r.distanceMeters)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 rounded-full"
                    disabled={!r.provider || acceptProvider.isPending}
                    onClick={() =>
                      active &&
                      r.provider &&
                      acceptProvider.mutate(
                        { requestId: active.id, providerId: r.provider.id },
                        { onSuccess: () => setRespondersOpen(false) },
                      )
                    }
                  >
                    Accept
                  </Button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Provider detail */}
      <ProviderDetailDialog
        provider={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

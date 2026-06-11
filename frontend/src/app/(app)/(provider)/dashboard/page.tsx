"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Location } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FullScreenLoader } from "@/components/shared/spinner";
import { ServiceMap } from "@/components/map";
import { IncomingRequestDialog } from "@/components/provider/incoming-request-dialog";
import { useMounted } from "@/hooks/use-mounted";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useApplication } from "@/features/providers";
import { useSetAvailability, useSetLocation } from "@/features/location/hooks";
import { useSocketEvent } from "@/features/realtime";
import { playAppSound, SOUND } from "@/lib/sounds";
import {
  useIncomingRequests,
  useRespondToRequest,
  useWithdrawResponse,
  INCOMING_KEY,
  type IncomingRequest,
} from "@/features/requests";

// Kathmandu fallback before the provider has set a location.
const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

export default function ProviderHomePage() {
  const mounted = useMounted();
  if (!mounted) return <FullScreenLoader label="Loading map…" />;
  return <ProviderHome />;
}

function ProviderHome() {
  const qc = useQueryClient();
  const { data: app, isLoading } = useApplication();
  const setAvailability = useSetAvailability();
  const setLocation = useSetLocation();
  const geo = useGeolocation();
  const respond = useRespondToRequest();
  const withdraw = useWithdrawResponse();
  const [availOpen, setAvailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hasLocation = app?.latitude != null && app?.longitude != null;
  const available = app?.isAvailable ?? false;

  // Only live when the provider is actually discoverable.
  const { data: incoming } = useIncomingRequests(available && hasLocation);

  // Flip a request's "offered" flag in the cache (optimistic, instant).
  function setResponded(id: string, value: boolean) {
    qc.setQueryData<IncomingRequest[]>(INCOMING_KEY, (prev) =>
      prev
        ? prev.map((r) => (r.id === id ? { ...r, hasResponded: value } : r))
        : prev,
    );
  }

  // Live: a new matching request arrived.
  useSocketEvent("request:new", () => {
    qc.invalidateQueries({ queryKey: INCOMING_KEY });
    void playAppSound(SOUND.matchFound);
  });
  // Live: a request was cancelled/expired — drop its marker instantly and
  // close its detail dialog if the provider happens to be viewing it.
  useSocketEvent<{ id: string }>("request:removed", ({ id }) => {
    setSelectedId((cur) => (cur === id ? null : cur));
    qc.setQueryData<IncomingRequest[]>(INCOMING_KEY, (prev) =>
      prev ? prev.filter((r) => r.id !== id) : prev,
    );
  });

  function captureLocation() {
    geo.request((c) =>
      setLocation.mutate({ latitude: c.latitude, longitude: c.longitude }),
    );
  }

  function handleRespond(id: string) {
    respond.mutate(id, { onSuccess: () => setResponded(id, true) });
  }

  function handleWithdraw(id: string) {
    withdraw.mutate(id, { onSuccess: () => setResponded(id, false) });
  }

  if (isLoading || !app) return <FullScreenLoader label="Loading…" />;

  const center: [number, number] = hasLocation
    ? [app.latitude!, app.longitude!]
    : DEFAULT_CENTER;
  const locating = geo.loading || setLocation.isPending;
  const requests = available && hasLocation ? (incoming ?? []) : [];
  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      {/* Full-bleed map — the provider's own exact location (read-only pin). */}
      <div className="absolute inset-0">
        <ServiceMap
          center={center}
          zoom={hasLocation ? 15 : 12}
          zoomControl={false}
          selfMarker={hasLocation ? center : undefined}
          requests={requests.map((r) => ({
            id: r.id,
            latitude: r.latitude,
            longitude: r.longitude,
            responded: r.hasResponded,
            onSelect: () => setSelectedId(r.id),
          }))}
        />
      </div>

      {/* Incoming request count */}
      {requests.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
          <div className="pointer-events-auto rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
            {requests.length} nearby request{requests.length > 1 ? "s" : ""} —
            tap a raised hand
          </div>
        </div>
      )}

      {/* No location yet → nudge */}
      {!hasLocation && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
          <div className="bg-warning text-warning-foreground pointer-events-auto rounded-full px-4 py-2 text-sm font-medium shadow-lg">
            Set your location to appear in search
          </div>
        </div>
      )}

      {/* Bottom-center: availability status → opens dialog */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-[1000] flex justify-center px-4">
        <button
          type="button"
          onClick={() => setAvailOpen(true)}
          className="pointer-events-auto flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-white pr-5 pl-4 text-sm font-semibold shadow-xl ring-1 ring-black/5 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <span
            className={
              available
                ? "size-2.5 rounded-full bg-emerald-500"
                : "bg-muted-foreground/40 size-2.5 rounded-full"
            }
          />
          {available ? "Available for work" : "Unavailable"}
        </button>
      </div>

      {/* Bottom-right: update my exact location */}
      <button
        type="button"
        onClick={captureLocation}
        disabled={locating}
        aria-label="Update my location"
        className="text-primary absolute right-5 bottom-7 z-[1000] flex size-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        <Location size={22} variant={locating ? "Linear" : "Bold"} />
      </button>

      {/* Availability dialog */}
      <Dialog open={availOpen} onOpenChange={setAvailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Availability</DialogTitle>
            <DialogDescription>
              Control whether seekers can find and hire you right now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-neutral-200/60 p-4">
              <div>
                <p className="font-semibold">Available for work</p>
                <p className="text-muted-foreground text-sm">
                  Turn off to temporarily hide from the map.
                </p>
              </div>
              <Switch
                checked={available}
                onCheckedChange={(v) => setAvailability.mutate(v)}
                disabled={setAvailability.isPending}
                aria-label="Toggle availability"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-neutral-200/60 p-4">
              <div>
                <p className="font-semibold">Your location</p>
                <p className="text-muted-foreground text-sm">
                  {hasLocation
                    ? "Seekers see your exact location."
                    : "Required to appear in search."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={captureLocation}
                disabled={locating}
                className="gap-1.5 rounded-full"
              >
                <Location size={16} variant="Bold" />
                {locating ? "Locating…" : hasLocation ? "Update" : "Set"}
              </Button>
            </div>

            {geo.error && (
              <p className="text-destructive text-sm">{geo.error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Incoming request detail */}
      <IncomingRequestDialog
        request={selectedRequest}
        responded={selectedRequest?.hasResponded ?? false}
        onRespond={handleRespond}
        responding={respond.isPending}
        onWithdraw={handleWithdraw}
        withdrawing={withdraw.isPending}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
}

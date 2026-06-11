"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Location } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/shared/spinner";
import { ServiceMap } from "@/components/map";
import { ProviderDetailDialog } from "@/components/seeker/provider-detail-dialog";
import { OffersStack } from "@/components/seeker/offers-stack";
import { BroadcastStatus } from "@/components/seeker/broadcast-status";
import {
  SearchDialog,
  type SearchInput,
} from "@/components/seeker/search-dialog";
import { useMounted } from "@/hooks/use-mounted";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useSeekerPin } from "@/hooks/use-seeker-pin";
import { useSkills } from "@/features/providers";
import { useNearbyProviders, type ProviderCard } from "@/features/discovery";
import { useSocketEvent } from "@/features/realtime";
import {
  useMyRequest,
  useCreateRequest,
  useCancelRequest,
  useRejectOffer,
  MY_REQUEST_KEY,
} from "@/features/requests";
import {
  useAcceptProvider,
  useActiveEngagement,
  useLiveLocation,
  useLiveRoute,
} from "@/features/engagements";
import { playAppSound, SOUND } from "@/lib/sounds";

export default function SeekerPage() {
  const mounted = useMounted();
  if (!mounted) return <FullScreenLoader label="Loading map…" />;
  return <SeekerDiscovery />;
}

function SeekerDiscovery() {
  const qc = useQueryClient();
  const geo = useGeolocation();
  const { pin, setPin } = useSeekerPin();
  const { data: skills } = useSkills();
  const { data: myRequest } = useMyRequest();
  const createRequest = useCreateRequest();
  const cancelRequest = useCancelRequest();
  const acceptProvider = useAcceptProvider();
  const rejectOffer = useRejectOffer();
  const { data: engagement } = useActiveEngagement();
  const { data: live } = useLiveLocation();
  const { data: liveRoute } = useLiveRoute();

  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<ProviderCard | null>(null);

  const active = myRequest ?? null;

  // Live: a provider offered (or withdrew) → refresh + chime.
  useSocketEvent("request:response", () => {
    qc.invalidateQueries({ queryKey: MY_REQUEST_KEY });
    void playAppSound(SOUND.offerReceived);
  });
  useSocketEvent("request:response-removed", () => {
    qc.invalidateQueries({ queryKey: MY_REQUEST_KEY });
  });

  // Auto-clear the request from view when it expires.
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

  // Newest offer first (prepended to the top of the stack).
  const offers = [...(active?.responders ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  // The accepted provider's live position (while engaged).
  const providerLive: [number, number] | null =
    engagement && live && live.engagementId === engagement.id
      ? [live.lat, live.lng]
      : null;
  // Route uses the throttled point (recomputed occasionally); marker uses live.
  const routeFrom: [number, number] | null =
    engagement && liveRoute && liveRoute.engagementId === engagement.id
      ? [liveRoute.lat, liveRoute.lng]
      : null;

  function handleSearch(input: SearchInput) {
    createRequest.mutate(
      { ...input, latitude: pin[0], longitude: pin[1] },
      { onSuccess: () => setSearchOpen(false) },
    );
  }

  return (
    <>
      <div className="absolute inset-0">
        <ServiceMap
          center={center}
          zoom={active ? 14 : 13}
          zoomControl={false}
          pin={center}
          ripple={active ? center : undefined}
          // Pin is fixed while broadcasting or engaged.
          onPinChange={
            active || engagement ? undefined : (lat, lng) => setPin(lat, lng)
          }
          route={routeFrom ? { from: routeFrom, to: center } : undefined}
          providers={
            providerLive
              ? [
                  {
                    id: "provider-live",
                    latitude: providerLive[0],
                    longitude: providerLive[1],
                    name: engagement?.other?.name ?? "Provider",
                  },
                ]
              : (providers ?? [])
                  .filter((p) => p.latitude != null && p.longitude != null)
                  .map((p) => ({
                    id: p.id,
                    latitude: p.latitude!,
                    longitude: p.longitude!,
                    name: p.name,
                    onSelect: () => setSelected(p),
                  }))
          }
        />
      </div>

      {active && (
        <>
          <OffersStack
            offers={offers}
            busy={acceptProvider.isPending}
            onAccept={(providerId) =>
              acceptProvider.mutate({ requestId: active.id, providerId })
            }
            onReject={(providerId) =>
              rejectOffer.mutate({ requestId: active.id, providerId })
            }
          />
          <BroadcastStatus
            skillName={active.skill?.name}
            offerCount={offers.length}
            cancelling={cancelRequest.isPending}
            onCancel={() => cancelRequest.mutate(active.id)}
          />
        </>
      )}

      {!active && !engagement && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-7 z-1000 flex justify-center px-4">
            <Button
              onClick={() => setSearchOpen(true)}
              className="pointer-events-auto h-14 rounded-full px-8 text-lg! font-semibold shadow-xl"
            >
              Need a hand?
            </Button>
          </div>
          <button
            type="button"
            onClick={() => geo.request((c) => setPin(c.latitude, c.longitude))}
            disabled={geo.loading}
            aria-label="Use my current location"
            className="text-primary absolute right-5 bottom-7 z-1000 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            <Location size={22} variant={geo.loading ? "Linear" : "Bold"} />
          </button>
        </>
      )}

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        skills={skills}
        onSearch={handleSearch}
        pending={createRequest.isPending}
        error={createRequest.isError}
      />

      <ProviderDetailDialog
        provider={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

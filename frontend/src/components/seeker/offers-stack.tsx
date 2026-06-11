"use client";

import type { Responder } from "@/features/requests";
import { OfferCard } from "./offer-card";

/** Scrollable stack of live offers, top-anchored; newest first, bottom fades. */
export function OffersStack({
  offers,
  onAccept,
  onReject,
  busy,
}: {
  offers: Responder[];
  onAccept: (providerId: string) => void;
  onReject: (providerId: string) => void;
  busy: boolean;
}) {
  if (offers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 bottom-28 z-[999] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md space-y-2 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_82%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_82%,transparent)]">
        {offers.map((o) => (
          <OfferCard
            key={o.id}
            offer={o}
            busy={busy}
            onAccept={() => o.provider && onAccept(o.provider.id)}
            onReject={() => o.provider && onReject(o.provider.id)}
          />
        ))}
      </div>
    </div>
  );
}

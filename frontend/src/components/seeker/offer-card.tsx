"use client";

import Image from "next/image";
import { CloseCircle, Star1 } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/format";
import type { Responder } from "@/features/requests";

/** A single provider offer in the seeker's live offers stack. */
export function OfferCard({
  offer,
  onAccept,
  onReject,
  busy,
}: {
  offer: Responder;
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const p = offer.provider;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5 duration-200 animate-in fade-in slide-in-from-top-2">
      {p?.avatarUrl ? (
        <Image
          src={p.avatarUrl}
          alt={p.name}
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {(p?.name ?? "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p?.name ?? "Provider"}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {offer.rating != null ? (
            <>
              <Star1 size={13} variant="Bold" className="text-amber-400" />
              {offer.rating}
              <span className="text-muted-foreground/70">
                ({offer.reviewCount})
              </span>
            </>
          ) : (
            <span>New</span>
          )}
          {offer.distanceMeters != null && (
            <span className="ml-0.5">
              · {formatDistance(offer.distanceMeters)}
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onReject}
        aria-label="Reject"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <CloseCircle size={22} />
      </button>
      <Button
        size="sm"
        className="shrink-0 rounded-full"
        disabled={!p || busy}
        onClick={onAccept}
      >
        Accept
      </Button>
    </div>
  );
}

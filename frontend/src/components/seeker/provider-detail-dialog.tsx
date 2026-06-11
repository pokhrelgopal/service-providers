"use client";

import Image from "next/image";
import { Verify, Call, Location, TickCircle } from "iconsax-reactjs";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/shared/stars";
import { formatDistance } from "@/lib/format";
import { useProviderDetail, type ProviderCard } from "@/features/discovery";

/** Placeholder phone + completed-jobs (rating/reviews are real). */
function dummyStats(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const completedJobs = 24 + (h % 476);
  const phone = `+977 98${String(10000000 + (h % 89999999)).slice(0, 8)}`;
  return { completedJobs, phone };
}

export function ProviderDetailDialog({
  provider,
  onOpenChange,
}: {
  provider: ProviderCard | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = provider != null;
  // Fetch full detail (includes the provider's uploaded selfie) once opened.
  const { data: detail } = useProviderDetail(provider?.id ?? null);
  const view = detail ?? provider;

  // Phone + completed-jobs are still placeholders; rating/reviews are real.
  const { completedJobs, phone } = dummyStats(provider?.id ?? "x");
  const rating = view?.rating ?? null;
  const reviews = view?.reviewCount ?? 0;
  const primarySkill = view?.skills[0]?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-3xl p-3 sm:max-w-xs">
        {view && (
          <>
            <DialogTitle className="sr-only">{view.name}</DialogTitle>

            {/* Photo */}
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-muted">
              {view.avatarUrl ? (
                <Image
                  src={view.avatarUrl}
                  alt={view.name ?? "Provider"}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-5xl font-bold text-primary">
                  {(view.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="px-2 pt-4 pb-1">
              {/* Name + verified */}
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-xl font-bold">{view.name}</h2>
                <Verify
                  size={20}
                  variant="Bold"
                  className="shrink-0 text-primary"
                />
              </div>

              {primarySkill && (
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {primarySkill}
                </p>
              )}

              {/* Contact number */}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                <Call size={16} className="text-muted-foreground" />
                {phone}
              </p>

              {/* Distance + completed work */}
              <div className="mt-3 flex items-center gap-5 text-sm">
                <span className="flex items-center gap-1.5">
                  <Location size={18} className="text-muted-foreground" />
                  <span className="font-semibold">
                    {provider?.distanceMeters != null
                      ? formatDistance(provider.distanceMeters)
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">away</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <TickCircle size={18} className="text-muted-foreground" />
                  <span className="font-semibold">{completedJobs}</span>
                  <span className="text-muted-foreground">jobs</span>
                </span>
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                {rating != null ? (
                  <>
                    <Stars value={rating} />
                    <span className="text-sm font-semibold">{rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({reviews})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* CTA */}
              <Button className="mt-4 w-full rounded-full" size="lg">
                Request service
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

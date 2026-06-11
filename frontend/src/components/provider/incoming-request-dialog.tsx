"use client";

import Image from "next/image";
import { Location, TickCircle } from "iconsax-reactjs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "@/lib/format";
import type { IncomingRequest } from "@/features/requests";

export function IncomingRequestDialog({
  request,
  responded,
  onRespond,
  responding,
  onWithdraw,
  withdrawing,
  onOpenChange,
}: {
  request: IncomingRequest | null;
  responded: boolean;
  onRespond: (id: string) => void;
  responding: boolean;
  onWithdraw: (id: string) => void;
  withdrawing: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const open = request != null;
  const distance =
    request?.distanceMeters != null
      ? `${formatDistance(request.distanceMeters)} away`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Service request
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Seeker */}
              <div className="flex items-center gap-3">
                {request.seeker?.avatarUrl ? (
                  <Image
                    src={request.seeker.avatarUrl}
                    alt={request.seeker.name}
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full font-semibold">
                    {(request.seeker?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="font-semibold">
                    {request.seeker?.name ?? "Someone"}
                  </p>
                  {distance && (
                    <p className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Location size={14} />
                      {distance}
                    </p>
                  )}
                </div>
              </div>

              {/* Problem */}
              <div>
                <Badge className="mb-2">Needs {request.skill?.name}</Badge>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm leading-relaxed">{request.description}</p>
              </div>
            </div>

            {responded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3 text-sm font-medium text-emerald-700">
                  <TickCircle size={18} variant="Bold" />
                  You offered to help — the seeker has been notified
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onWithdraw(request.id)}
                  disabled={withdrawing}
                  className="text-destructive hover:text-destructive w-full"
                >
                  {withdrawing ? "Cancelling…" : "Cancel offer"}
                </Button>
              </div>
            ) : (
              <div className="flex w-full justify-end">
                <Button
                  onClick={() => onRespond(request.id)}
                  disabled={responding}
                  size="lg"
                  className="w-fit rounded-full"
                >
                  {responding ? "Sending…" : "Offer Help"}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

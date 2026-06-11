"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDay, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Stars } from "@/components/shared/stars";
import { useCreateReview } from "@/features/reviews";
import {
  REQUEST_HISTORY_KEY,
  type RequestHistoryItem,
} from "@/features/history";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function RequestHistoryDialog({
  item,
  onOpenChange,
}: {
  item: RequestHistoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const open = item != null;
  const provider = item?.provider;
  const name = provider?.name ?? "Provider";

  function submit() {
    if (!rating || !item) return;
    createReview.mutate(
      {
        engagementId: item.engagementId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
          qc.invalidateQueries({ queryKey: REQUEST_HISTORY_KEY });
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setRating(0);
          setComment("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="min-h-96 gap-0 sm:max-w-xl">
        {item && (
          <>
            <DialogTitle className="sr-only">Request to {name}</DialogTitle>

            {/* Provider */}
            <div className="flex items-center gap-3">
              {provider?.avatarUrl ? (
                <Image
                  src={provider.avatarUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{name}</p>
                {item.skill && (
                  <p className="text-muted-foreground truncate text-sm">
                    {item.skill}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="mt-4">
              <Row
                label="Requested"
                value={`${formatDay(item.createdAt)} · ${formatTime(item.createdAt)}`}
              />
              {item.completedAt && (
                <Row
                  label="Completed"
                  value={`${formatDay(item.completedAt)} · ${formatTime(item.completedAt)}`}
                />
              )}
              {item.description && (
                <div className="py-2">
                  <p className="text-muted-foreground text-sm">Details</p>
                  <p className="mt-1 text-sm">{item.description}</p>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="mt-4 rounded-xl bg-neutral-100 p-4">
              {item.review ? (
                <>
                  <p className="text-sm font-semibold">Your rating</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Stars value={item.review.rating} size={18} />
                    <span className="text-sm font-semibold">
                      {item.review.rating}.0
                    </span>
                  </div>
                  {item.review.comment && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      “{item.review.comment}”
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Rate {name}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    You haven&apos;t rated this job yet.
                  </p>
                  <div className="mt-3 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        className="cursor-pointer"
                      >
                        <Star
                          size={28}
                          className={cn(
                            n <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Add a note (optional)…"
                    className="border-input focus-visible:ring-ring/50 mt-3 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                  />
                  <Button
                    onClick={submit}
                    disabled={!rating || createReview.isPending}
                    className="mt-3 w-full"
                  >
                    {createReview.isPending ? "Submitting…" : "Submit rating"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

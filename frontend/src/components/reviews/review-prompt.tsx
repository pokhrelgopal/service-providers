"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocketEvent } from "@/features/realtime";
import {
  usePendingReview,
  useCreateReview,
  PENDING_REVIEW_KEY,
} from "@/features/reviews";

/** After a job completes, prompts the seeker to rate the provider. Renders
 * nothing for providers (they never have a pending review). */
export function ReviewPrompt() {
  const qc = useQueryClient();
  const { data: pending } = usePendingReview();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [dismissed, setDismissed] = useState<string | null>(null);

  useSocketEvent("engagement:ended", () => {
    qc.invalidateQueries({ queryKey: PENDING_REVIEW_KEY });
  });

  if (!pending) return null;

  const open = pending.engagementId !== dismissed;

  function submit() {
    if (!rating || !pending) return;
    createReview.mutate(
      {
        engagementId: pending.engagementId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && setDismissed(pending.engagementId)}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          {pending.provider.avatarUrl ? (
            <Image
              src={pending.provider.avatarUrl}
              alt={pending.provider.name ?? "Provider"}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {(pending.provider.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <DialogTitle>How was {pending.provider.name}?</DialogTitle>
          <DialogDescription>
            Your rating helps other people find good help.
          </DialogDescription>
        </DialogHeader>

        {/* Stars */}
        <div className="flex justify-center gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="cursor-pointer"
            >
              <Star
                size={32}
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
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />

        <Button
          onClick={submit}
          disabled={!rating || createReview.isPending}
          className="w-full"
        >
          {createReview.isPending ? "Submitting…" : "Submit review"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

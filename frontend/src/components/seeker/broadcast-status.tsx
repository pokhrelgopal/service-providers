"use client";

import { Button } from "@/components/ui/button";

/** Bottom status bar shown while a broadcast is live. */
export function BroadcastStatus({
  skillName,
  offerCount,
  onCancel,
  cancelling,
}: {
  skillName?: string | null;
  offerCount: number;
  onCancel: () => void;
  cancelling: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-7 z-1000 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="size-2.5 animate-pulse rounded-full bg-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Looking for {skillName ?? "help"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {offerCount === 0
              ? "Broadcasting to nearby providers…"
              : `${offerCount} provider${offerCount > 1 ? "s" : ""} can help`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive"
          onClick={onCancel}
          disabled={cancelling}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

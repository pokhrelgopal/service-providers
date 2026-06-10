"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/** Sidebar availability toggle (UI only for now — not yet wired to the API). */
export function AvailabilityToggle() {
  const [available, setAvailable] = useState(true);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:hidden">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            available ? "bg-success" : "bg-neutral-300",
          )}
        />
        <span className="text-sm font-medium">
          {available ? "Available" : "Unavailable"}
        </span>
      </div>
      <Switch
        checked={available}
        onCheckedChange={setAvailable}
        aria-label="Toggle availability"
      />
    </div>
  );
}

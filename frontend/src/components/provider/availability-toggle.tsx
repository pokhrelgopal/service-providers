"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useApplication } from "@/features/providers";
import { useSetAvailability } from "@/features/location/hooks";

/** Sidebar availability toggle — providers can take themselves off the map. */
export function AvailabilityToggle() {
  const { data: app } = useApplication();
  const setAvailability = useSetAvailability();

  const available = app?.isAvailable ?? true;

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
        onCheckedChange={(v) => setAvailability.mutate(v)}
        disabled={setAvailability.isPending || !app}
        aria-label="Toggle availability"
      />
    </div>
  );
}

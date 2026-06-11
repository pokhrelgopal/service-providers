import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only 5-star rating display. */
export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={cn(
            n <= filled
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

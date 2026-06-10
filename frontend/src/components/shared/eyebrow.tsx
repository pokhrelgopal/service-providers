import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Small pill label used above section headings. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground/70",
        className,
      )}
    >
      {children}
    </span>
  );
}

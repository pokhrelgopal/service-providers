import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Page heading used across the dashboard. */
export function Heading({
  text,
  className,
}: {
  text: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-xl font-semibold md:text-[29px]", className)}>
      {text}
    </h2>
  );
}

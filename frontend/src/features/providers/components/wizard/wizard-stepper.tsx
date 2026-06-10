import { TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";

export const WIZARD_STEPS = [
  "Details",
  "Verify phone",
  "Skills",
  "Documents",
  "Review",
] as const;

/** Centered numbered progress indicator for the provider wizard. */
export function WizardStepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-2">
      {WIZARD_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/15 text-primary"
                    : "bg-neutral-200 text-muted-foreground",
              )}
            >
              {done ? <TickCircle size={16} variant="Bold" /> : n}
            </span>
            {i < WIZARD_STEPS.length - 1 && (
              <span
                className={cn(
                  "h-0.5 w-8 rounded",
                  done ? "bg-primary/40" : "bg-neutral-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

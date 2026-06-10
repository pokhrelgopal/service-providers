import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Minimal centered loading state. */
export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <span
        className={cn(
          "size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary",
        )}
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Shown when the API can't be reached — offers a retry instead of redirecting. */
export function ConnectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">Can&apos;t reach the server</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We&apos;re having trouble connecting. Check your connection — this will
          retry automatically.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry now
        </Button>
      )}
    </div>
  );
}

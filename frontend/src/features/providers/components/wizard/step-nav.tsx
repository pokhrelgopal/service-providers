import { Button } from "@/components/ui/button";

export function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
  label,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  /** Optional hint shown next to the Next button (e.g. why it's disabled). */
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
        {onNext && (
          <Button type="button" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

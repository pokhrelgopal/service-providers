import { Health } from "iconsax-reactjs";

/** Placeholder for provider sections built in later milestones. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-neutral-50 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Health size={24} variant="Bold" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        This section is coming in an upcoming milestone.
      </p>
    </div>
  );
}

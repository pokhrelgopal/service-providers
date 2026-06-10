"use client";

import { useState } from "react";

import { FullScreenLoader } from "@/components/shared/spinner";
import { SkillPicker } from "@/components/provider/skill-picker";
import {
  useSkills,
  useUpdateApplication,
  type ProviderApplication,
} from "@/features/providers";
import { StepNav } from "./step-nav";

export function SkillsStep({
  app,
  onBack,
  onNext,
}: {
  app: ProviderApplication;
  onBack: () => void;
  onNext: () => void;
}) {
  const { data: skills, isLoading } = useSkills();
  const update = useUpdateApplication();
  const [selected, setSelected] = useState<string[]>(
    app.skills.map((s) => s.id),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium">What services do you offer?</p>
        <p className="text-xs text-muted-foreground">
          Pick everything that applies — you can offer more than one.
        </p>
      </div>
      {isLoading || !skills ? (
        <FullScreenLoader label="Loading skills…" />
      ) : (
        <SkillPicker skills={skills} selectedIds={selected} onToggle={toggle} />
      )}
      <StepNav
        onBack={onBack}
        onNext={() =>
          update.mutate({ skillIds: selected }, { onSuccess: onNext })
        }
        nextDisabled={selected.length === 0 || update.isPending}
        nextLabel={update.isPending ? "Saving…" : "Continue"}
      />
    </div>
  );
}

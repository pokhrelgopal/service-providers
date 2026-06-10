"use client";

import { TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import type { Skill } from "@/features/providers";

export function SkillPicker({
  skills,
  selectedIds,
  onToggle,
}: {
  skills: Skill[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const selected = selectedIds.includes(skill.id);
        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => onToggle(skill.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-neutral-100 text-foreground/70 hover:bg-neutral-200",
            )}
          >
            {selected && <TickCircle size={15} variant="Bold" />}
            {skill.name}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SearchNormal1 } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SkillOption {
  id: string;
  name: string;
  slug: string;
}

export interface SearchInput {
  skill: string;
  description: string;
  radius: number;
}

const RADIUS_OPTIONS = [
  { value: 1000, label: "1 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

const chip = (active: boolean) =>
  active
    ? "cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
    : "cursor-pointer rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70";

/** Broadcast form: pick a service + range, describe the problem, Search. */
export function SearchDialog({
  open,
  onOpenChange,
  skills,
  onSearch,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: SkillOption[] | undefined;
  onSearch: (input: SearchInput) => void;
  pending: boolean;
  error: boolean;
}) {
  const [service, setService] = useState("");
  const [range, setRange] = useState(5000);
  const [description, setDescription] = useState("");

  const canSubmit = !!service && description.trim().length >= 5;

  function submit() {
    if (!canSubmit) return;
    onSearch({ skill: service, description: description.trim(), radius: range });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find help near you</DialogTitle>
          <DialogDescription>
            Describe what you need. We&apos;ll broadcast it to matching providers
            around your pin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-2">
            <p className="text-sm font-medium">Service</p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {skills?.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s.slug)}
                  className={chip(service === s.slug)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Distance</p>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRange(opt.value)}
                  className={chip(range === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Describe the problem</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g. My kitchen sink is leaking under the cabinet and needs urgent repair."
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Couldn&apos;t broadcast — please try again.
            </p>
          )}
        </div>

        <Button
          onClick={submit}
          disabled={!canSubmit || pending}
          className="w-full gap-2"
        >
          <SearchNormal1 size={18} />
          {pending ? "Broadcasting…" : "Search"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

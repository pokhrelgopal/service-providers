"use client";

import { useRouter } from "next/navigation";
import { Verify } from "iconsax-reactjs";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { useSubmitApplication, type ProviderApplication } from "@/features/providers";
import type { ApiError } from "@/lib/axios";
import { StepNav } from "./step-nav";

export function ReviewStep({
  app,
  onBack,
}: {
  app: ProviderApplication;
  onBack: () => void;
}) {
  const submit = useSubmitApplication();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium">Review your application</p>
      <dl className="grid gap-3 text-sm">
        <Row label="Legal name" value={app.legalName ?? "—"} />
        <Row
          label="Phone"
          value={
            app.phoneVerified ? (
              <span className="inline-flex items-center gap-1">
                {app.phoneDialCode}
                {app.phoneNumber}
                <Verify size={18} variant="Bold" className="text-success" />
              </span>
            ) : (
              "Not verified"
            )
          }
        />
        <div>
          <dt className="text-muted-foreground">Skills</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {app.skills.map((s) => (
              <Badge key={s.id} variant="secondary">
                {s.name}
              </Badge>
            ))}
          </dd>
        </div>
        <Row
          label="Documents"
          value={`${app.documents.length} uploaded (selfie + ID)`}
        />
      </dl>

      {submit.isError && (
        <p className="text-sm text-destructive">
          {(submit.error as unknown as ApiError).message}
        </p>
      )}

      <StepNav
        onBack={onBack}
        onNext={() =>
          submit.mutate(undefined, {
            onSuccess: () => router.replace("/dashboard"),
          })
        }
        nextLabel={submit.isPending ? "Submitting…" : "Submit application"}
        nextDisabled={submit.isPending}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

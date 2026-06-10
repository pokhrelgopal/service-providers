"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";

import { Container } from "@/components/shared/container";
import { FullScreenLoader } from "@/components/shared/spinner";
import { useApplication, type ProviderApplication } from "@/features/providers";
import { WizardStepper } from "./wizard-stepper";
import { DetailsStep } from "./details-step";
import { VerifyPhoneStep } from "./verify-phone-step";
import { SkillsStep } from "./skills-step";
import { DocumentsStep } from "./documents-step";
import { ReviewStep } from "./review-step";

/** Furthest incomplete step, derived from the saved draft (1-based). */
function computeResumeStep(app: ProviderApplication): number {
  if (!app.legalName || !app.phoneNumber) return 1;
  if (!app.phoneVerified) return 2;
  if (app.skills.length === 0) return 3;
  const hasSelfie = app.documents.some((d) => d.type === "selfie");
  const hasId = app.documents.some((d) => d.type === "id_document");
  if (!hasSelfie || !hasId) return 4;
  return 5;
}

export function ProviderWizard() {
  const { data: app, isLoading } = useApplication();
  // Step lives in the URL (?step=) so it survives reloads within a session.
  // When absent (e.g. a fresh login), we fall back to the furthest incomplete
  // step computed from the saved draft, so users resume exactly where they left.
  const [stepParam, setStep] = useQueryState(
    "step",
    parseAsInteger.withOptions({ history: "push" }),
  );
  const router = useRouter();

  // Already submitted/approved providers can't edit — send them to the dashboard.
  const locked = app?.status === "submitted" || app?.status === "approved";
  useEffect(() => {
    if (locked) router.replace("/dashboard");
  }, [locked, router]);

  if (isLoading || !app || locked) return <FullScreenLoader label="Loading…" />;

  const resumeStep = computeResumeStep(app);
  const step = stepParam ?? resumeStep;
  const resuming = stepParam === null && resumeStep > 1;

  return (
    <main className="min-h-dvh bg-secondary/40 py-10">
      <Container className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-center text-2xl font-bold tracking-tight">
            Become a provider
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Complete your verification to start receiving requests.
          </p>
        </div>

        {resuming && (
          <div className="mb-6 rounded-xl bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
            Welcome back — continuing from where you left off.
          </div>
        )}

        <WizardStepper step={step} />

        <div className="rounded-2xl bg-white p-6">
          {step === 1 && <DetailsStep app={app} onNext={() => setStep(2)} />}
          {step === 2 && (
            <VerifyPhoneStep
              app={app}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <SkillsStep
              app={app}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <DocumentsStep
              app={app}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}
          {step === 5 && <ReviewStep app={app} onBack={() => setStep(4)} />}
        </div>
      </Container>
    </main>
  );
}

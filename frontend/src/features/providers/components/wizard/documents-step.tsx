"use client";

import { DocumentUpload } from "@/components/provider/document-upload";
import { useUploadDocument, type ProviderApplication } from "@/features/providers";
import type { ApiError } from "@/lib/axios";
import { StepNav } from "./step-nav";

export function DocumentsStep({
  app,
  onBack,
  onNext,
}: {
  app: ProviderApplication;
  onBack: () => void;
  onNext: () => void;
}) {
  const upload = useUploadDocument();
  const selfie = app.documents.find((d) => d.type === "selfie");
  const idDoc = app.documents.find((d) => d.type === "id_document");
  const ready = !!selfie && !!idDoc;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        We&apos;ll compare your selfie against the photo on your ID document
        during verification, so make sure your face is clearly visible in both.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <DocumentUpload
          type="selfie"
          label="Your photo (selfie)"
          helpText="A clear, recent photo of your face."
          current={selfie}
          uploading={upload.isPending && upload.variables?.type === "selfie"}
          onSelect={(file) => upload.mutate({ type: "selfie", file })}
        />
        <DocumentUpload
          type="id_document"
          label="ID document (citizenship)"
          helpText="The page showing your photo and name."
          current={idDoc}
          uploading={
            upload.isPending && upload.variables?.type === "id_document"
          }
          onSelect={(file) => upload.mutate({ type: "id_document", file })}
        />
      </div>
      {upload.isError && (
        <p className="text-sm text-destructive">
          {(upload.error as unknown as ApiError).message}
        </p>
      )}
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!ready}
        nextLabel="Continue"
      />
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Camera, Gallery } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import type { DocumentType, ProviderDocument } from "@/features/providers";

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const MAX_BYTES = 5 * 1024 * 1024;

export function DocumentUpload({
  type,
  label,
  helpText,
  current,
  uploading,
  onSelect,
}: {
  type: DocumentType;
  label: string;
  helpText?: string;
  current?: ProviderDocument;
  uploading: boolean;
  onSelect: (file: File) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length) {
        const code = rejections[0].errors[0]?.code;
        setError(
          code === "file-too-large"
            ? "Image must be under 5 MB."
            : "Use a JPG, PNG or WebP image.",
        );
        return;
      }
      if (accepted[0]) {
        setError(null);
        onSelect(accepted[0]);
      }
    },
    [onSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  const preview = current?.thumbnailUrl ?? current?.url ?? null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          "flex aspect-4/3 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-neutral-100 text-muted-foreground transition-colors hover:bg-neutral-200",
          isDragActive && "bg-primary/10 ring-2 ring-primary/40",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative size-full">
            <Image
              src={preview}
              alt={label}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
            />
          </div>
        ) : (
          <>
            {type === "selfie" ? (
              <Camera size={26} variant="Bold" />
            ) : (
              <Gallery size={26} variant="Bold" />
            )}
            <span className="px-4 text-center text-xs">
              {uploading
                ? "Uploading…"
                : isDragActive
                  ? "Drop the image here"
                  : "Drag & drop or click to upload"}
            </span>
          </>
        )}
      </div>
      {current && !uploading && (
        <p className="text-xs font-medium text-primary">
          Uploaded — drag a new image to replace
        </p>
      )}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

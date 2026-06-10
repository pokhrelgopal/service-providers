"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateApplication, type ProviderApplication } from "@/features/providers";

const detailsSchema = z.object({
  legalName: z.string().min(2, "Enter your full name as on your citizenship"),
  phoneNumber: z
    .string()
    .regex(/^\d{7,15}$/, "Enter a valid phone number (digits only)"),
  serviceDescription: z.string().max(1000).optional(),
});
type DetailsValues = z.infer<typeof detailsSchema>;

export function DetailsStep({
  app,
  onNext,
}: {
  app: ProviderApplication;
  onNext: () => void;
}) {
  const update = useUpdateApplication();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      legalName: app.legalName ?? "",
      phoneNumber: app.phoneNumber ?? "",
      serviceDescription: app.serviceDescription ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, { onSuccess: onNext });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="legalName">Full name (as on citizenship)</Label>
        <Input id="legalName" {...register("legalName")} />
        <p className="text-xs text-muted-foreground">
          This can differ from your display name — use your legal/citizenship
          name.
        </p>
        {errors.legalName && (
          <p className="text-sm text-destructive">{errors.legalName.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phoneNumber">Contact number</Label>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-input bg-neutral-50 px-3 text-sm text-muted-foreground">
            🇳🇵 +977
          </span>
          <Input
            id="phoneNumber"
            inputMode="numeric"
            placeholder="98XXXXXXXX"
            className="flex-1"
            {...register("phoneNumber")}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="serviceDescription">About your service (optional)</Label>
        <textarea
          id="serviceDescription"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...register("serviceDescription")}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save & continue"}
        </Button>
      </div>
    </form>
  );
}

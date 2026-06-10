"use client";

import { useState } from "react";
import { TickCircle } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendOtp, useVerifyOtp, type ProviderApplication } from "@/features/providers";
import type { ApiError } from "@/lib/axios";
import { StepNav } from "./step-nav";

export function VerifyPhoneStep({
  app,
  onBack,
  onNext,
}: {
  app: ProviderApplication;
  onBack: () => void;
  onNext: () => void;
}) {
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  if (app.phoneVerified) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <TickCircle size={18} variant="Bold" /> Phone verified —{" "}
          {app.phoneDialCode}
          {app.phoneNumber}
        </div>
        <StepNav onBack={onBack} onNext={onNext} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm">
          We&apos;ll verify{" "}
          <span className="font-medium">
            {app.phoneDialCode}
            {app.phoneNumber}
          </span>
          .
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          SMS isn&apos;t wired up yet — your code is printed in the API server
          console.
        </p>
      </div>

      {!sent ? (
        <Button
          type="button"
          onClick={() =>
            sendOtp.mutate(undefined, { onSuccess: () => setSent(true) })
          }
          disabled={sendOtp.isPending}
        >
          {sendOtp.isPending ? "Sending…" : "Send verification code"}
        </Button>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="otp">Enter 6-digit code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
          {verifyOtp.isError && (
            <p className="text-sm text-destructive">
              {(verifyOtp.error as unknown as ApiError).message}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => verifyOtp.mutate(code)}
              disabled={code.length !== 6 || verifyOtp.isPending}
            >
              {verifyOtp.isPending ? "Verifying…" : "Verify"}
            </Button>
            <button
              type="button"
              onClick={() => sendOtp.mutate()}
              className="text-sm font-medium text-primary"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      <StepNav
        onBack={onBack}
        nextDisabled
        label="Verify your phone to continue"
      />
    </div>
  );
}

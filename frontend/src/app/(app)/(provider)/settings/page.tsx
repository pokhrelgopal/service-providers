"use client";

import { AccountActions } from "@/components/account/account-actions";
import { BackToMap } from "@/components/shared/back-to-map";

export default function Page() {
  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        <header className="mb-6">
          <BackToMap href="/dashboard" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account and sign-in.
          </p>
        </header>

        <AccountActions />
      </div>
    </div>
  );
}

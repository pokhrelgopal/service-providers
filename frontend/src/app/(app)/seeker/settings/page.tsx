"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AccountActions } from "@/components/account/account-actions";

export default function Page() {
  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        <header className="mb-6">
          <Link
            href="/seeker"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to map
          </Link>
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

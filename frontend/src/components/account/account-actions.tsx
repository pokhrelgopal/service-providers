"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLogoutAll, useDeleteAccount } from "@/features/auth";
import { useActiveEngagement } from "@/features/engagements";

/** The account-management cards shared by seeker + provider settings:
 * log out of all devices, and delete account. Deletion is blocked while a job
 * is in progress (the server enforces this too). */
export function AccountActions() {
  const logoutAll = useLogoutAll();
  const deleteAccount = useDeleteAccount();
  const { data: activeJob } = useActiveEngagement();
  const [confirm, setConfirm] = useState<"logout-all" | "delete" | null>(null);

  const hasActiveJob = activeJob != null;
  const busy = logoutAll.isPending || deleteAccount.isPending;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Log out of all devices */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Log out of all devices</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Sign out everywhere you&apos;re currently logged in.
            </p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0 rounded-full"
            disabled={busy}
            onClick={() => setConfirm("logout-all")}
          >
            Logout
          </Button>
        </div>

        {/* Delete account */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Delete account</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Your account is permanently deleted after 15 days. Log back in
              before then to reactivate it.
            </p>
            {hasActiveJob && (
              <p className="text-destructive mt-1.5 text-sm font-medium">
                You have a job in progress. Finish it before deleting your
                account.
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            className="shrink-0 rounded-full"
            disabled={busy || hasActiveJob}
            onClick={() => setConfirm("delete")}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Log out all — confirm */}
      <Dialog
        open={confirm === "logout-all"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out of all devices?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out here and on every other device. You can
              log back in anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="rounded-full"
              onClick={() => logoutAll.mutate()}
              disabled={logoutAll.isPending}
            >
              {logoutAll.isPending ? "Logging out…" : "Log out all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete account — confirm */}
      <Dialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out immediately. Your account is permanently
              deleted after 15 days of inactivity — log back in before then and
              everything is restored.
            </DialogDescription>
          </DialogHeader>
          {deleteAccount.isError && (
            <p className="text-destructive text-sm font-medium">
              {deleteAccount.error?.message ??
                "Couldn't delete your account. Please try again."}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => deleteAccount.mutate()}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

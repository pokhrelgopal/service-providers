"use client";

import { useState } from "react";
import Image from "next/image";
import { Verify, TickCircle, CloseCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useApproveApplication,
  useRejectApplication,
  type PendingApplication,
} from "@/features/admin";

/** One pending provider application with approve / reject-with-reason actions. */
export function RegistrationCard({ app }: { app: PendingApplication }) {
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        {/* Applicant details */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            {app.user?.avatarUrl ? (
              <Image
                src={app.user.avatarUrl}
                alt={app.user.name}
                width={44}
                height={44}
                className="rounded-full"
              />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {(app.user?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{app.user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {app.user?.email}
              </p>
            </div>
          </div>

          <dl className="grid gap-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Legal name:</dt>
              <dd className="font-medium">{app.legalName ?? "—"}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Phone:</dt>
              <dd className="inline-flex items-center gap-1 font-medium">
                {app.phoneDialCode}
                {app.phoneNumber}
                {app.phoneVerified && (
                  <Verify size={16} variant="Bold" className="text-success" />
                )}
              </dd>
            </div>
          </dl>

          {app.serviceDescription && (
            <p className="text-sm text-muted-foreground">
              {app.serviceDescription}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {app.skills.map((s) => (
              <Badge key={s.id} variant="secondary">
                {s.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="flex gap-3">
          {app.documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1.5"
            >
              <span className="text-xs text-muted-foreground capitalize">
                {doc.type === "id_document" ? "ID document" : "Selfie"}
              </span>
              <div className="relative size-28 overflow-hidden rounded-xl bg-neutral-100 transition-transform group-hover:-translate-y-0.5">
                <Image
                  src={doc.thumbnailUrl ?? doc.url}
                  alt={doc.type}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 border-t border-neutral-100 pt-4">
        {rejecting ? (
          <div className="flex flex-col gap-3">
            <textarea
              rows={2}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (shown to the applicant)…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            {reject.isError && (
              <p className="text-sm text-destructive">
                Couldn&apos;t reject — try again.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                disabled={reason.trim().length < 3 || busy}
                onClick={() =>
                  reject.mutate({ id: app.id, reason: reason.trim() })
                }
              >
                {reject.isPending ? "Rejecting…" : "Confirm rejection"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              disabled={busy}
              onClick={() => approve.mutate(app.id)}
              className="gap-1.5"
            >
              <TickCircle size={18} variant="Bold" />
              {approve.isPending ? "Approving…" : "Approve"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setRejecting(true)}
              className={cn("gap-1.5 text-destructive")}
            >
              <CloseCircle size={18} />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/shared/spinner";
import { Panel, Field } from "@/components/provider/profile-panel";
import { BackToMap } from "@/components/shared/back-to-map";
import { ROLE_LABELS, useMe } from "@/features/auth";
import { useApplication, type ProviderApplication } from "@/features/providers";

const STATUS_META: Record<
  ProviderApplication["status"],
  {
    label: string;
    variant: "secondary" | "success" | "warning" | "destructive";
  }
> = {
  draft: { label: "Draft", variant: "warning" },
  submitted: { label: "Under review", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function ProfilePage() {
  const { data: user } = useMe();
  const { data: app, isLoading } = useApplication();

  if (isLoading || !app || !user) return <FullScreenLoader label="Loading…" />;

  const status = STATUS_META[app.status];

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-8 pb-12">
        <div>
          <BackToMap href="/dashboard" />
        </div>

        {/* Identity */}
        <Panel title="My Profile">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full text-xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {ROLE_LABELS[r]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* Verification */}
        <Panel title="Provider verification">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {app.status === "rejected" && app.rejectionReason && (
            <p className="bg-destructive/10 text-destructive mb-4 rounded-lg px-4 py-3 text-sm">
              {app.rejectionReason}
            </p>
          )}
          {app.status === "submitted" && (
            <p className="bg-primary/10 text-primary mb-4 rounded-lg px-4 py-3 text-sm">
              Your application is under review. We&apos;ll notify you once
              it&apos;s approved.
            </p>
          )}

          <dl className="flex flex-col divide-y divide-neutral-100 text-sm">
            <Field label="Legal name" value={app.legalName ?? "—"} />
            <Field
              label="Contact number"
              value={
                <span className="inline-flex items-center gap-1">
                  {app.phoneDialCode}
                  {app.phoneNumber}
                  {app.phoneVerified && (
                    <TickCircle
                      size={15}
                      variant="Bold"
                      className="text-success"
                    />
                  )}
                </span>
              }
            />
            {app.serviceDescription && (
              <Field label="About" value={app.serviceDescription} />
            )}
          </dl>

          <div className="mt-4">
            <p className="text-muted-foreground mb-2 text-sm">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {app.skills.map((s) => (
                <Badge key={s.id} variant="outline">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>

        {/* Documents */}
        <Panel title="Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            {app.documents.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No documents uploaded.
              </p>
            )}
            {app.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2"
              >
                <span className="text-muted-foreground text-xs font-medium capitalize">
                  {doc.type === "id_document" ? "ID document" : "Selfie"}
                </span>
                <div
                  className={cn(
                    "relative aspect-4/3 overflow-hidden rounded-xl bg-neutral-100 transition-transform group-hover:-translate-y-0.5",
                  )}
                >
                  <Image
                    src={doc.thumbnailUrl ?? doc.url}
                    alt={doc.type}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              </a>
            ))}
          </div>
        </Panel>

        {(app.status === "draft" || app.status === "rejected") && (
          <Button asChild className="self-start">
            <a href="/onboarding/provider">Continue / edit application</a>
          </Button>
        )}
      </div>
    </div>
  );
}

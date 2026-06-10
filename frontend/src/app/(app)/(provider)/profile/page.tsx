"use client";

import Image from "next/image";
import { TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/shared/spinner";
import { ROLE_LABELS, useMe } from "@/features/auth";
import { useApplication, type ProviderApplication } from "@/features/providers";

const STATUS_META: Record<
  ProviderApplication["status"],
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" }
> = {
  draft: { label: "Draft", variant: "warning" },
  submitted: { label: "Under review", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { data: user } = useMe();
  const { data: app, isLoading } = useApplication();

  if (isLoading || !app || !user) return <FullScreenLoader label="Loading…" />;

  const status = STATUS_META[app.status];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
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
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
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
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {app.status === "rejected" && app.rejectionReason && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {app.rejectionReason}
          </p>
        )}
        {app.status === "submitted" && (
          <p className="mb-4 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
            Your application is under review. We&apos;ll notify you once it&apos;s
            approved.
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
                  <TickCircle size={15} variant="Bold" className="text-success" />
                )}
              </span>
            }
          />
          {app.serviceDescription && (
            <Field label="About" value={app.serviceDescription} />
          )}
        </dl>

        <div className="mt-4">
          <p className="mb-2 text-sm text-muted-foreground">Skills</p>
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
            <p className="text-sm text-muted-foreground">
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
              <span className="text-xs font-medium capitalize text-muted-foreground">
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
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

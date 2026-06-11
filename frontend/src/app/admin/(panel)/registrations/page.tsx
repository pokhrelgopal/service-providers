"use client";

import { FullScreenLoader } from "@/components/shared/spinner";
import { RegistrationCard } from "@/components/admin/registration-card";
import { usePendingApplications } from "@/features/admin";

export default function RegistrationsPage() {
  const { data: applications, isLoading } = usePendingApplications();

  if (isLoading) return <FullScreenLoader label="Loading registrations…" />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Registrations</h2>
        <p className="text-sm text-muted-foreground">
          Review provider applications and approve or reject them.
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-muted-foreground">
          No pending registrations right now.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((app) => (
            <RegistrationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}

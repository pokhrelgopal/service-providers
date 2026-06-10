"use client";

import {
  MoneyRecive,
  Calendar,
  Briefcase,
  Clock,
  Messages1,
  Star1,
} from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { Heading } from "@/components/shared/heading";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useMe, useOnboarded } from "@/features/auth";

export default function ProviderDashboardPage() {
  const { data: user } = useMe();
  const { providerStatus } = useOnboarded();

  const card1 = [
    {
      icon: MoneyRecive,
      title: "Total Earnings",
      value: "$20,520.32",
      change: { percentage: "12.5%", type: "increase" as const },
    },
    {
      icon: Calendar,
      title: "This Month",
      value: "$4,310.00",
      change: { percentage: "8.2%", type: "increase" as const },
    },
    
  ];

  const card2=[{ icon: Briefcase, title: "Completed Jobs", value: "128" },
    { icon: Clock, title: "Active Jobs", value: "5" },
    { icon: Messages1, title: "Reviews", value: "96" },
    { icon: Star1, title: "Average Rating", value: "4.8" }]

  return (
    <div className="space-y-6">
      {providerStatus && providerStatus !== "approved" && (
        <StatusBanner status={providerStatus} />
      )}

      <Heading text={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {card1.map((c) => (
          <DashboardCard key={c.title} {...c} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {card2.map((c) => (
          <DashboardCard key={c.title} {...c} />
        ))}
      </div>
    </div>
  );
}

function StatusBanner({
  status,
}: {
  status: "draft" | "submitted" | "rejected";
}) {
  const map = {
    draft: {
      tone: "bg-warning/15 text-warning-foreground",
      text: "Your provider application is a draft — finish and submit it to go live.",
    },
    submitted: {
      tone: "bg-primary/10 text-primary",
      text: "Your application is under review. We'll notify you once it's approved.",
    },
    rejected: {
      tone: "bg-destructive/10 text-destructive",
      text: "Your application was rejected. Please review the feedback on your profile.",
    },
  } as const;
  const m = map[status];
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm font-medium", m.tone)}>
      {m.text}
    </div>
  );
}

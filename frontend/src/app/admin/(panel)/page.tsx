"use client";

import Link from "next/link";
import { Clock, Verify, Profile2User, CalendarTick } from "iconsax-reactjs";

import { Heading } from "@/components/shared/heading";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/auth";
import { usePendingApplications } from "@/features/admin";

export default function AdminDashboardPage() {
  const { data: user } = useMe();
  const { data: pending, isLoading } = usePendingApplications();
  const count = pending?.length ?? 0;

  const cards = [
    {
      icon: Clock,
      title: "Pending Registrations",
      value: isLoading ? "—" : String(count),
    },
    { icon: Verify, title: "Approved Providers", value: "—" },
    { icon: Profile2User, title: "Total Providers", value: "—" },
    { icon: CalendarTick, title: "Reviewed This Week", value: "—" },
  ];

  return (
    <div className="space-y-6">
      <Heading text={`Welcome back, ${user?.name?.split(" ")[0] ?? "Admin"}`} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <DashboardCard key={c.title} {...c} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[#DFE3E550] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Provider applications</p>
          <p className="text-sm text-gray-500">
            {count > 0
              ? `${count} application${count === 1 ? "" : "s"} waiting for review.`
              : "No applications waiting right now."}
          </p>
        </div>
        <Button asChild disabled={count === 0}>
          <Link href="/admin/registrations">Go to Registrations</Link>
        </Button>
      </div>
    </div>
  );
}

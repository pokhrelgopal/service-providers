import type { ComponentType } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DashboardCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  change?: { percentage: string; type: "increase" | "decrease" };
  className?: string;
}

/** KPI card: maroon-tinted icon, title, value, optional change badge. */
export function DashboardCard({
  icon: Icon,
  title,
  value,
  change,
  className,
}: DashboardCardProps) {
  const ChangeIcon = change?.type === "decrease" ? ArrowDown : ArrowUp;
  const changeClasses =
    change?.type === "decrease"
      ? "bg-destructive/10 text-destructive"
      : "bg-success/15 text-success";

  return (
    <div
      className={cn(
        "flex h-fit w-full flex-col justify-between gap-3 rounded-lg border border-gray-200/70 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="size-8 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">{title}</span>
          <span className="text-xl font-bold text-gray-900">{value}</span>
        </div>
      </div>
      {change && (
        <div className="mt-auto flex items-center text-xs">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1",
              changeClasses,
            )}
          >
            <ChangeIcon className="size-4" />
            {change.percentage}
          </span>
          <span className="ml-2 text-gray-500">from last month</span>
        </div>
      )}
    </div>
  );
}

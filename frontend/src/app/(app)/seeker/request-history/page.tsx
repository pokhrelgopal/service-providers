"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Clock } from "iconsax-reactjs";

import { formatDay, formatTime } from "@/lib/format";
import { Stars } from "@/components/shared/stars";
import { RequestHistoryDialog } from "@/components/seeker/request-history-dialog";
import { useRequestHistory, type RequestHistoryItem } from "@/features/history";

export default function Page() {
  const { data, isLoading } = useRequestHistory();
  const [selected, setSelected] = useState<RequestHistoryItem | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <Link
            href="/seeker"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to map
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Request History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your past service requests and the ratings you left.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 text-center">
            <span className="text-muted-foreground flex size-12 items-center justify-center rounded-full bg-white">
              <Clock size={24} />
            </span>
            <div>
              <p className="font-semibold">No requests yet</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Your completed requests will show up here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.map((item) => {
              const name = item.provider?.name ?? "Provider";
              return (
                <li key={item.engagementId}>
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 text-left transition-colors"
                  >
                    {item.provider?.avatarUrl ? (
                      <Image
                        src={item.provider.avatarUrl}
                        alt={name}
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {item.skill ?? "Service"} ·{" "}
                        {formatDay(item.completedAt ?? item.createdAt)},{" "}
                        {formatTime(item.completedAt ?? item.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {item.review ? (
                        <Stars value={item.review.rating} size={14} />
                      ) : (
                        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
                          Rate
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RequestHistoryDialog
        item={selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

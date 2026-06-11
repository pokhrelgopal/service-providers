"use client";

import Image from "next/image";
import { TickCircle } from "iconsax-reactjs";

import { formatDay, formatTime } from "@/lib/format";
import { Stars } from "@/components/shared/stars";
import { InfiniteSentinel } from "@/components/shared/infinite-sentinel";
import { BackToMap } from "@/components/shared/back-to-map";
import { useCompletedJobs } from "@/features/jobs";

export default function CompletedJobsPage() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCompletedJobs();

  const jobs = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <BackToMap href="/dashboard" />
          <h1 className="text-2xl font-bold tracking-tight">Completed Jobs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Jobs you&apos;ve finished and how clients rated them.
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
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 text-center">
            <span className="text-muted-foreground flex size-12 items-center justify-center rounded-full bg-gray-100">
              <TickCircle size={24} />
            </span>
            <div>
              <p className="font-semibold">No completed jobs yet</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Jobs you finish will appear here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job) => {
              const name = job.seeker?.name ?? "Seeker";
              return (
                <li key={job.engagementId} className="rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-3">
                    {job.seeker?.avatarUrl ? (
                      <Image
                        src={job.seeker.avatarUrl}
                        alt={name}
                        width={44}
                        height={44}
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-muted-foreground truncate text-[12px]">
                        {/* {job.skill ?? "Service"} ·{" "} */}
                        You completed this job on{" "}
                        {formatDay(job.completedAt ?? job.createdAt)},{" "}
                        {formatTime(job.completedAt ?? job.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {job.review ? (
                        <Stars value={job.review.rating} size={14} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Not rated
                        </span>
                      )}
                    </div>
                  </div>

                  {job.review?.comment && (
                    <div>
                      <p className="text-muted-foreground mt-2 rounded-lg bg-neutral-100/60 p-3 text-sm">
                        {job.review.comment}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isFetchingNextPage && (
          <p className="text-muted-foreground mt-3 text-center text-sm">
            Loading…
          </p>
        )}
        <InfiniteSentinel
          onReach={fetchNextPage}
          disabled={!hasNextPage || isFetchingNextPage}
        />
      </div>
    </div>
  );
}

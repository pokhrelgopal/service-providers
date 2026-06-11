"use client";

import { z } from "zod";
import { useInfiniteQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";

const completedJobSchema = z.object({
  engagementId: z.string(),
  skill: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  seeker: z
    .object({
      id: z.string(),
      name: z.string(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
  review: z
    .object({
      rating: z.number(),
      comment: z.string().nullable(),
    })
    .nullable(),
});
export type CompletedJob = z.infer<typeof completedJobSchema>;

const pageSchema = z.object({
  items: z.array(completedJobSchema),
  nextCursor: z.string().nullable(),
});

export const COMPLETED_JOBS_KEY = ["engagements", "completed-jobs"] as const;

const PAGE_SIZE = 20;

/** Provider's completed jobs, cursor-paginated for infinite scroll. */
export function useCompletedJobs() {
  return useInfiniteQuery({
    queryKey: COMPLETED_JOBS_KEY,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/engagements/completed-jobs", {
        params: { limit: PAGE_SIZE, cursor: pageParam || undefined },
      });
      return pageSchema.parse(res.data?.data);
    },
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

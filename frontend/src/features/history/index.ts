"use client";

import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";

const historyItemSchema = z.object({
  engagementId: z.string(),
  requestId: z.string(),
  skill: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  provider: z
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
      createdAt: z.string(),
    })
    .nullable(),
});
export type RequestHistoryItem = z.infer<typeof historyItemSchema>;

export const REQUEST_HISTORY_KEY = ["requests", "history"] as const;

/** The seeker's completed jobs, newest first, each with the review they left. */
export function useRequestHistory() {
  return useQuery({
    queryKey: REQUEST_HISTORY_KEY,
    queryFn: async () => {
      const res = await api.get("/engagements/history");
      return z.array(historyItemSchema).parse(res.data?.data ?? []);
    },
    staleTime: 30_000,
  });
}

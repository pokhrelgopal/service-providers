"use client";

import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/axios";

const pendingReviewSchema = z
  .object({
    engagementId: z.string(),
    provider: z.object({
      id: z.string(),
      name: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    }),
  })
  .nullable();
export type PendingReview = z.infer<typeof pendingReviewSchema>;

export const PENDING_REVIEW_KEY = ["reviews", "pending"] as const;

export function usePendingReview() {
  return useQuery({
    queryKey: PENDING_REVIEW_KEY,
    queryFn: async () => {
      const res = await api.get("/reviews/pending");
      return pendingReviewSchema.parse(res.data?.data ?? null);
    },
    staleTime: 30_000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      engagementId: string;
      rating: number;
      comment?: string;
    }) => {
      await api.post("/reviews", input);
    },
    onSuccess: () => qc.setQueryData(PENDING_REVIEW_KEY, null),
  });
}

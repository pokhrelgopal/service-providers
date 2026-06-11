"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MY_REQUEST_KEY } from "@/features/requests";
import {
  acceptProvider,
  completeEngagement,
  fetchActiveEngagement,
  fetchMessages,
  markEngagementRead,
  sendMessage,
} from "./api";
import type { ChatMessage } from "./schemas";

export const ACTIVE_ENGAGEMENT_KEY = ["engagements", "active"] as const;
export const messagesKey = (id: string) =>
  ["engagements", id, "messages"] as const;

export function useActiveEngagement() {
  return useQuery({
    queryKey: ACTIVE_ENGAGEMENT_KEY,
    queryFn: fetchActiveEngagement,
    staleTime: 10_000,
  });
}

export function useAcceptProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptProvider,
    onSuccess: (engagement) => {
      qc.setQueryData(ACTIVE_ENGAGEMENT_KEY, engagement);
      qc.setQueryData(MY_REQUEST_KEY, null);
    },
  });
}

export function useMessages(engagementId: string | null) {
  return useQuery({
    queryKey: messagesKey(engagementId ?? "none"),
    queryFn: () => fetchMessages(engagementId!),
    enabled: !!engagementId,
  });
}

export function useSendMessage(engagementId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(engagementId, body),
    onSuccess: (message) => {
      qc.setQueryData<ChatMessage[]>(messagesKey(engagementId), (prev) =>
        prev ? [...prev, message] : [message],
      );
    },
  });
}

export function useMarkRead() {
  return useMutation({ mutationFn: markEngagementRead });
}

export function useCompleteEngagement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeEngagement,
    onSuccess: () => qc.setQueryData(ACTIVE_ENGAGEMENT_KEY, null),
  });
}

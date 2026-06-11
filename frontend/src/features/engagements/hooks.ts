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
  uploadChatImage,
} from "./api";
import type { ChatMessage } from "./schemas";

export const ACTIVE_ENGAGEMENT_KEY = ["engagements", "active"] as const;
export const LIVE_LOCATION_KEY = ["engagements", "liveLocation"] as const;
// Throttled copy of the live location, used to limit route recomputation.
export const LIVE_ROUTE_KEY = ["engagements", "liveRoute"] as const;
export const messagesKey = (id: string) =>
  ["engagements", id, "messages"] as const;

export interface LiveLocation {
  engagementId: string;
  lat: number;
  lng: number;
}

function liveLocationQuery(key: readonly unknown[]) {
  return {
    queryKey: key,
    queryFn: () => null,
    enabled: false,
    initialData: null,
  } as const;
}

/** The other party's live GPS — moves the marker on every ping. Populated by
 * the global LiveLocation listener via setQueryData. */
export function useLiveLocation() {
  return useQuery<LiveLocation | null>(liveLocationQuery(LIVE_LOCATION_KEY));
}

/** Throttled live GPS — drives the (expensive) route, not the marker. */
export function useLiveRoute() {
  return useQuery<LiveLocation | null>(liveLocationQuery(LIVE_ROUTE_KEY));
}

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

/**
 * Send a text message with an optimistic bubble:
 *  - `onMutate` immediately appends a local `sending` message (snappy UI, and
 *    it survives an internet drop instead of silently failing),
 *  - `onSuccess` swaps it for the confirmed server message,
 *  - `onError` flags it `failed` so the UI can offer a retry.
 *
 * The caller passes a `tempId` (e.g. `crypto.randomUUID()`) used to find the
 * optimistic message again on success/error.
 */
export function useSendMessage(engagementId: string) {
  const qc = useQueryClient();
  const key = messagesKey(engagementId);
  const patch = (updater: (prev: ChatMessage[]) => ChatMessage[]) =>
    qc.setQueryData<ChatMessage[]>(key, (prev) => updater(prev ?? []));

  return useMutation({
    mutationFn: (payload: { body: string; tempId: string }) =>
      sendMessage(engagementId, { body: payload.body }),
    onMutate: ({ body, tempId }) => {
      const optimistic: ChatMessage = {
        id: tempId,
        body,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        mine: true,
        status: "sending",
      };
      patch((prev) => [...prev, optimistic]);
    },
    onSuccess: (serverMessage, { tempId }) => {
      patch((prev) => prev.map((m) => (m.id === tempId ? serverMessage : m)));
    },
    onError: (_err, { tempId }) => {
      patch((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
    },
  });
}

/** Upload an image then send it as a message. */
export function useSendImage(engagementId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const imageKey = await uploadChatImage(engagementId, file);
      return sendMessage(engagementId, { imageKey });
    },
    onSuccess: (message) =>
      qc.setQueryData<ChatMessage[]>(messagesKey(engagementId), (prev) =>
        prev ? [...prev, message] : [message],
      ),
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

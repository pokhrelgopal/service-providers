"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelRequest,
  createRequest,
  fetchIncomingRequests,
  fetchMyRequest,
  respondToRequest,
  withdrawResponse,
  rejectOffer,
} from "./api";
import type { MyRequest } from "./schemas";

export const MY_REQUEST_KEY = ["requests", "mine"] as const;
export const INCOMING_KEY = ["requests", "incoming"] as const;

export function useMyRequest() {
  return useQuery({
    queryKey: MY_REQUEST_KEY,
    queryFn: fetchMyRequest,
    staleTime: 10_000,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: (data) => {
      qc.setQueryData(MY_REQUEST_KEY, data.request);
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      qc.setQueryData(MY_REQUEST_KEY, null);
    },
  });
}

export function useIncomingRequests(enabled = true) {
  return useQuery({
    queryKey: INCOMING_KEY,
    queryFn: fetchIncomingRequests,
    enabled,
    staleTime: 10_000,
    // Safety net so expired requests drop even without a socket event.
    refetchInterval: 60_000,
  });
}

export function useRespondToRequest() {
  return useMutation({ mutationFn: respondToRequest });
}

export function useWithdrawResponse() {
  return useMutation({ mutationFn: withdrawResponse });
}

/** Seeker rejects one responder — removes it from the offers stack instantly. */
export function useRejectOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      providerId,
    }: {
      requestId: string;
      providerId: string;
    }) => rejectOffer(requestId, providerId),
    onMutate: ({ providerId }) => {
      qc.setQueryData<MyRequest | null>(MY_REQUEST_KEY, (prev) =>
        prev
          ? {
              ...prev,
              responders: prev.responders.filter(
                (r) => r.provider?.id !== providerId,
              ),
            }
          : prev,
      );
    },
  });
}

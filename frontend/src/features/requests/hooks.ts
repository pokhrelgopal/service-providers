"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelRequest,
  createRequest,
  fetchIncomingRequests,
  fetchMyRequest,
  respondToRequest,
  withdrawResponse,
} from "./api";

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

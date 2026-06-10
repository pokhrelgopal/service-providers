"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveApplication,
  fetchPendingApplications,
  rejectApplication,
} from "./api";

export const PENDING_APPLICATIONS_KEY = ["admin", "pending-applications"] as const;

export function usePendingApplications() {
  return useQuery({
    queryKey: PENDING_APPLICATIONS_KEY,
    queryFn: fetchPendingApplications,
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveApplication,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PENDING_APPLICATIONS_KEY }),
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      rejectApplication(vars.id, vars.reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PENDING_APPLICATIONS_KEY }),
  });
}

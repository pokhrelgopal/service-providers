"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { APPLICATION_QUERY_KEY } from "@/features/providers";
import { ME_QUERY_KEY } from "@/features/auth";
import { setProviderAvailability, setProviderLocation } from "./api";

export function useSetLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { latitude: number; longitude: number }) =>
      setProviderLocation(vars.latitude, vars.longitude),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY }),
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => setProviderAvailability(isAvailable),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

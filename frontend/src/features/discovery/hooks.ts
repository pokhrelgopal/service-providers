"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchNearby, fetchProviderDetail, type NearbyParams } from "./api";

export function useNearbyProviders(
  params: NearbyParams | null,
) {
  return useQuery({
    queryKey: ["discovery", "nearby", params],
    queryFn: () => fetchNearby(params!),
    enabled: !!params,
    staleTime: 30_000,
  });
}

export function useProviderDetail(id: string | null) {
  return useQuery({
    queryKey: ["discovery", "provider", id],
    queryFn: () => fetchProviderDetail(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

import { z } from "zod";
import { api } from "@/lib/axios";
import { providerCardSchema, type ProviderCard } from "./schemas";

export interface NearbyParams {
  lat: number;
  lng: number;
  radius: number;
  skill?: string;
}

export async function fetchNearby(
  params: NearbyParams,
): Promise<ProviderCard[]> {
  const res = await api.get("/discovery/nearby", { params });
  return z.array(providerCardSchema).parse(res.data?.data);
}

export async function fetchProviderDetail(id: string): Promise<ProviderCard> {
  const res = await api.get(`/discovery/providers/${id}`);
  return providerCardSchema.parse(res.data?.data);
}

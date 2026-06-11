import { api } from "@/lib/axios";

export async function setProviderLocation(
  latitude: number,
  longitude: number,
): Promise<void> {
  await api.patch("/provider/location", { latitude, longitude });
}

export async function setProviderAvailability(
  isAvailable: boolean,
): Promise<void> {
  await api.patch("/provider/availability", { isAvailable });
}

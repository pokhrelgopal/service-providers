import { z } from "zod";

export const providerCardSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  serviceDescription: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  skills: z.array(
    z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  ),
  distanceMeters: z.number().nullable(),
});
export type ProviderCard = z.infer<typeof providerCardSchema>;

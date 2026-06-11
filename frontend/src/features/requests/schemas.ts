import { z } from "zod";
import { providerCardSchema } from "@/features/discovery/schemas";

export const skillRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const userRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

/** A seeker's request as seen by a matching provider. */
export const incomingRequestSchema = z.object({
  id: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number(),
  skill: skillRefSchema.nullable(),
  seeker: userRefSchema.nullable(),
  distanceMeters: z.number().nullable(),
  hasResponded: z.boolean(),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type IncomingRequest = z.infer<typeof incomingRequestSchema>;

export const responderSchema = z.object({
  id: z.string(),
  provider: userRefSchema.nullable(),
  distanceMeters: z.number().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number(),
  createdAt: z.string(),
});
export type Responder = z.infer<typeof responderSchema>;

/** The seeker's own broadcast (+ responders). */
export const myRequestSchema = z.object({
  id: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number(),
  skill: skillRefSchema.nullable(),
  status: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  responders: z.array(responderSchema),
});
export type MyRequest = z.infer<typeof myRequestSchema>;

export const createRequestResultSchema = z.object({
  request: myRequestSchema,
  providers: z.array(providerCardSchema),
});
export type CreateRequestResult = z.infer<typeof createRequestResultSchema>;

export interface CreateRequestInput {
  skill: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
}

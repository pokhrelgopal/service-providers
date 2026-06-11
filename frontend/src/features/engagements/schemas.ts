import { z } from "zod";

export const engagementOtherSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

export const engagementSchema = z.object({
  id: z.string(),
  status: z.string(),
  role: z.enum(["seeker", "provider"]),
  other: engagementOtherSchema.nullable(),
  location: z
    .object({ latitude: z.number(), longitude: z.number() })
    .nullable(),
  unread: z.boolean(),
  createdAt: z.string(),
});
export type Engagement = z.infer<typeof engagementSchema>;

export const messageSchema = z.object({
  id: z.string(),
  body: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  mine: z.boolean(),
});

/**
 * A chat message. `status` is client-only and present just for *optimistic*
 * messages we've added locally before the server confirmed them:
 *  - `sending` — POST in flight
 *  - `failed`  — POST failed (e.g. internet drop); offer a retry
 * Confirmed messages from the server have no `status`.
 */
export type ChatMessage = z.infer<typeof messageSchema> & {
  status?: "sending" | "failed";
};

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
  unread: z.boolean(),
  createdAt: z.string(),
});
export type Engagement = z.infer<typeof engagementSchema>;

export const messageSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  mine: z.boolean(),
});
export type ChatMessage = z.infer<typeof messageSchema>;

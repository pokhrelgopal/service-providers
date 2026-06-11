import { z } from "zod";
import { api } from "@/lib/axios";
import {
  engagementSchema,
  messageSchema,
  type ChatMessage,
  type Engagement,
} from "./schemas";

export async function acceptProvider(input: {
  requestId: string;
  providerId: string;
}): Promise<Engagement> {
  const res = await api.post("/engagements", input);
  return engagementSchema.parse(res.data?.data);
}

export async function fetchActiveEngagement(): Promise<Engagement | null> {
  const res = await api.get("/engagements/active");
  return engagementSchema.nullable().parse(res.data?.data ?? null);
}

export async function fetchMessages(
  engagementId: string,
): Promise<ChatMessage[]> {
  const res = await api.get(`/engagements/${engagementId}/messages`);
  return z.array(messageSchema).parse(res.data?.data ?? []);
}

export async function sendMessage(
  engagementId: string,
  body: string,
): Promise<ChatMessage> {
  const res = await api.post(`/engagements/${engagementId}/messages`, { body });
  return messageSchema.parse(res.data?.data);
}

export async function markEngagementRead(engagementId: string): Promise<void> {
  await api.post(`/engagements/${engagementId}/read`);
}

export async function completeEngagement(engagementId: string): Promise<void> {
  await api.post(`/engagements/${engagementId}/complete`);
}

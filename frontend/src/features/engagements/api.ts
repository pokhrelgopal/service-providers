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
  payload: { body?: string; imageKey?: string },
): Promise<ChatMessage> {
  const res = await api.post(
    `/engagements/${engagementId}/messages`,
    payload,
  );
  return messageSchema.parse(res.data?.data);
}

const presignSchema = z.object({ uploadUrl: z.string(), key: z.string() });

/** Get a presigned PUT URL for a chat image, upload the file, return the key. */
export async function uploadChatImage(
  engagementId: string,
  file: File,
): Promise<string> {
  const res = await api.post(`/engagements/${engagementId}/image`, {
    contentType: file.type,
  });
  const { uploadUrl, key } = presignSchema.parse(res.data?.data);
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error("Image upload failed");
  return key;
}

export async function markEngagementRead(engagementId: string): Promise<void> {
  await api.post(`/engagements/${engagementId}/read`);
}

export async function completeEngagement(engagementId: string): Promise<void> {
  await api.post(`/engagements/${engagementId}/complete`);
}

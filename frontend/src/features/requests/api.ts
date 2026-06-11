import { z } from "zod";
import { api } from "@/lib/axios";
import {
  createRequestResultSchema,
  incomingRequestSchema,
  myRequestSchema,
  type CreateRequestInput,
  type CreateRequestResult,
  type IncomingRequest,
  type MyRequest,
} from "./schemas";

export async function createRequest(
  input: CreateRequestInput,
): Promise<CreateRequestResult> {
  const res = await api.post("/requests", input);
  return createRequestResultSchema.parse(res.data?.data);
}

export async function fetchMyRequest(): Promise<MyRequest | null> {
  const res = await api.get("/requests/mine");
  return myRequestSchema.nullable().parse(res.data?.data ?? null);
}

export async function cancelRequest(id: string): Promise<void> {
  await api.delete(`/requests/${id}`);
}

export async function fetchIncomingRequests(): Promise<IncomingRequest[]> {
  const res = await api.get("/requests/incoming");
  return z.array(incomingRequestSchema).parse(res.data?.data ?? []);
}

export async function respondToRequest(id: string): Promise<void> {
  await api.post(`/requests/${id}/respond`);
}

export async function withdrawResponse(id: string): Promise<void> {
  await api.delete(`/requests/${id}/respond`);
}

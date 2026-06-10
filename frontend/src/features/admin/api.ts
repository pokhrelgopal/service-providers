import { z } from "zod";
import { api } from "@/lib/axios";
import { pendingApplicationSchema, type PendingApplication } from "./schemas";

export async function fetchPendingApplications(): Promise<PendingApplication[]> {
  const res = await api.get("/admin/providers/pending");
  return z.array(pendingApplicationSchema).parse(res.data?.data);
}

export async function approveApplication(id: string): Promise<void> {
  await api.post(`/admin/providers/${id}/approve`);
}

export async function rejectApplication(
  id: string,
  reason: string,
): Promise<void> {
  await api.post(`/admin/providers/${id}/reject`, { reason });
}

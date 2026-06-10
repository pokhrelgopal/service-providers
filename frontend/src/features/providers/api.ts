import { api } from "@/lib/axios";
import {
  providerApplicationSchema,
  skillSchema,
  type DocumentType,
  type ProviderApplication,
  type Skill,
} from "./schemas";
import { z } from "zod";

export async function fetchSkills(): Promise<Skill[]> {
  const res = await api.get("/skills");
  return z.array(skillSchema).parse(res.data?.data);
}

export async function fetchApplication(): Promise<ProviderApplication> {
  const res = await api.get("/provider/me");
  return providerApplicationSchema.parse(res.data?.data);
}

export interface UpdateApplicationInput {
  legalName?: string;
  phoneNumber?: string;
  serviceDescription?: string;
  skillIds?: string[];
}

export async function updateApplication(
  input: UpdateApplicationInput,
): Promise<ProviderApplication> {
  const res = await api.patch("/provider/application", input);
  return providerApplicationSchema.parse(res.data?.data);
}

export async function sendPhoneOtp(): Promise<void> {
  await api.post("/provider/phone/send-otp");
}

export async function verifyPhoneOtp(code: string): Promise<void> {
  await api.post("/provider/phone/verify-otp", { code });
}

export async function submitApplication(): Promise<ProviderApplication> {
  const res = await api.post("/provider/application/submit");
  return providerApplicationSchema.parse(res.data?.data);
}

const presignResponseSchema = z.object({
  uploadUrl: z.string(),
  objectKey: z.string(),
});

/** Presign → PUT the file straight to storage → confirm with the API. */
export async function uploadDocument(
  type: DocumentType,
  file: File,
): Promise<ProviderApplication> {
  const presign = await api.post("/provider/documents/presign", {
    type,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  const { uploadUrl, objectKey } = presignResponseSchema.parse(
    presign.data?.data,
  );

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error("Upload failed");

  const res = await api.post("/provider/documents/confirm", {
    type,
    objectKey,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  return providerApplicationSchema.parse(res.data?.data);
}

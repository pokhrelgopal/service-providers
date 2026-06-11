import { z } from "zod";
import { providerStatusSchema } from "@/features/auth/schemas";

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type Skill = z.infer<typeof skillSchema>;

export const documentTypeSchema = z.enum(["selfie", "id_document"]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const providerDocumentSchema = z.object({
  id: z.string(),
  type: documentTypeSchema,
  mimeType: z.string(),
  sizeBytes: z.number(),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type ProviderDocument = z.infer<typeof providerDocumentSchema>;

export const providerApplicationSchema = z.object({
  id: z.string(),
  status: providerStatusSchema,
  legalName: z.string().nullable(),
  phoneCountry: z.string(),
  phoneDialCode: z.string(),
  phoneNumber: z.string().nullable(),
  phoneVerified: z.boolean(),
  serviceDescription: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  submittedAt: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isAvailable: z.boolean(),
  skills: z.array(skillSchema),
  documents: z.array(providerDocumentSchema),
});
export type ProviderApplication = z.infer<typeof providerApplicationSchema>;

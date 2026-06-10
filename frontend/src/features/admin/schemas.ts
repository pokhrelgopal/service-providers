import { z } from "zod";
import { providerStatusSchema } from "@/features/auth/schemas";

const adminDocumentSchema = z.object({
  id: z.string(),
  type: z.enum(["selfie", "id_document"]),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
});

const applicantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
});

/** Shape returned by GET /admin/providers/pending (presentForAdmin). */
export const pendingApplicationSchema = z.object({
  id: z.string(),
  status: providerStatusSchema,
  legalName: z.string().nullable(),
  phoneDialCode: z.string(),
  phoneNumber: z.string().nullable(),
  phoneVerified: z.boolean(),
  serviceDescription: z.string().nullable(),
  submittedAt: z.string().nullable(),
  skills: z.array(z.object({ id: z.string(), name: z.string() })),
  documents: z.array(adminDocumentSchema),
  user: applicantSchema.nullable(),
});
export type PendingApplication = z.infer<typeof pendingApplicationSchema>;

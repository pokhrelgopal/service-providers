import { z } from "zod";

export const userRoleSchema = z.enum(["seeker", "provider", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Human-friendly role names for display. */
export const ROLE_LABELS: Record<UserRole, string> = {
  seeker: "Service Seeker",
  provider: "Service Provider",
  admin: "Admin",
};

export const providerStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);
export type ProviderStatus = z.infer<typeof providerStatusSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  roles: z.array(userRoleSchema),
  /** Provider verification status, or null if the user isn't a provider. */
  providerStatus: providerStatusSchema.nullable(),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

/** Shape of POST /auth/refresh `data`. */
export const sessionSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;

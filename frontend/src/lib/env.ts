import { z } from "zod";

/**
 * Public, build-time env for the browser bundle. Only `NEXT_PUBLIC_*` vars are
 * available client-side, so they are validated here and re-exported typed.
 * Server-only secrets never belong in this file.
 */
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url(),
  NEXT_PUBLIC_MAP_TILE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_MAP_TILE_URL: process.env.NEXT_PUBLIC_MAP_TILE_URL,
});

if (!parsed.success) {
  // Fail loudly during build/dev rather than shipping a misconfigured client.
  throw new Error(
    `Invalid public environment variables:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;

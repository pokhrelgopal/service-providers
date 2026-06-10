import { api } from "@/lib/axios";
import { setAccessToken } from "@/lib/auth-token";
import { sessionSchema, userSchema, type Session, type User } from "./schemas";

/** The "self" route — single source of truth for the current user. */
export async function fetchMe(): Promise<User> {
  const res = await api.get("/auth/me");
  return userSchema.parse(res.data?.data);
}

/** Email + password login (admins). Stores the access token on success. */
export async function login(
  email: string,
  password: string,
): Promise<Session> {
  const res = await api.post("/auth/login", { email, password });
  const session = sessionSchema.parse(res.data?.data);
  setAccessToken(session.accessToken);
  return session;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function logoutAll(): Promise<void> {
  await api.post("/auth/logout-all");
}

export { refreshAccessToken } from "@/lib/axios";

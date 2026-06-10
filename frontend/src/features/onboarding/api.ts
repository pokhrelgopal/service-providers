import { api } from "@/lib/axios";

export async function chooseSeeker(): Promise<void> {
  await api.post("/onboarding/seeker");
}

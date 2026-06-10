"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ME_QUERY_KEY } from "@/features/auth";
import { chooseSeeker } from "./api";

/** Seeker onboarding: grant the role, refresh `me`, head to the app. */
export function useChooseSeeker() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chooseSeeker,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      router.replace("/seeker");
    },
  });
}

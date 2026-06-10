"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ME_QUERY_KEY } from "@/features/auth";
import {
  fetchApplication,
  fetchSkills,
  sendPhoneOtp,
  submitApplication,
  updateApplication,
  uploadDocument,
  verifyPhoneOtp,
  type UpdateApplicationInput,
} from "./api";
import type { DocumentType } from "./schemas";

export const SKILLS_QUERY_KEY = ["skills"] as const;
export const APPLICATION_QUERY_KEY = ["provider", "application"] as const;

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_QUERY_KEY,
    queryFn: fetchSkills,
    staleTime: Infinity,
  });
}

export function useApplication(enabled = true) {
  return useQuery({
    queryKey: APPLICATION_QUERY_KEY,
    queryFn: fetchApplication,
    enabled,
  });
}

function useApplicationMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  { touchesMe = false } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEY });
      if (touchesMe) {
        await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      }
    },
  });
}

export function useUpdateApplication() {
  return useApplicationMutation((input: UpdateApplicationInput) =>
    updateApplication(input),
  );
}

export function useSendOtp() {
  return useMutation({ mutationFn: sendPhoneOtp });
}

export function useVerifyOtp() {
  return useApplicationMutation((code: string) => verifyPhoneOtp(code));
}

export function useUploadDocument() {
  return useApplicationMutation((vars: { type: DocumentType; file: File }) =>
    uploadDocument(vars.type, vars.file),
  );
}

/** Submitting grants the provider role, so refresh `me` too. */
export function useSubmitApplication() {
  return useApplicationMutation(() => submitApplication(), { touchesMe: true });
}

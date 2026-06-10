/** BullMQ queue that decouples sending email from the request lifecycle. */
export const EMAIL_QUEUE = 'email';

/** Job names handled by the email processor. */
export const EmailJob = {
  ACCOUNT_VERIFIED: 'account-verified',
} as const;

export interface AccountVerifiedData {
  to: string;
  name: string;
}

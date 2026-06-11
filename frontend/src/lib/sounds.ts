// Thin wrapper around react-sounds. Dynamically imported so the audio runtime
// only loads in the browser (never during SSR). All calls are fire-and-forget
// and swallow autoplay/unlock errors.

export const SOUND = {
  /** Provider — a new matching request arrived. */
  matchFound: "ui/success_blip",
  /** Seeker — a provider offered to help. */
  offerReceived: "notification/info",
} as const;

let preloaded = false;

export async function preloadAppSounds(): Promise<void> {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  try {
    const { preloadSounds } = await import("react-sounds");
    await preloadSounds([SOUND.matchFound, SOUND.offerReceived]);
  } catch {
    // ignore — sounds are non-essential
  }
}

export async function playAppSound(name: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { playSound } = await import("react-sounds");
    await playSound(name);
  } catch {
    // ignore — audio may be locked until a user gesture, or offline
  }
}

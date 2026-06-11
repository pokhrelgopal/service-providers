// A self-contained, *stoppable* ring tone built with the Web Audio API.
//
// We don't use the fire-and-forget `playAppSound` for ringing because those
// clips can't be cancelled — the last one keeps playing after you accept or
// decline. Here every beep is a short oscillator we hold a handle to, so
// `stopRing()` silences everything immediately.

let audioCtx: AudioContext | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let active: OscillatorNode[] = [];

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/** One short tone with a soft attack/decay so it doesn't click. */
function tone(ctx: AudioContext, start: number, freq: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
  active.push(osc);
  osc.onended = () => {
    active = active.filter((o) => o !== osc);
  };
}

/** Classic two-pulse "ring … ring" burst. */
function ringOnce() {
  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const t = ctx.currentTime;
  tone(ctx, t, 480, 0.4);
  tone(ctx, t + 0.6, 480, 0.4);
}

export function startRing(): void {
  stopRing();
  ringOnce();
  interval = setInterval(ringOnce, 3000);
}

export function stopRing(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  for (const osc of active) {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  }
  active = [];
}

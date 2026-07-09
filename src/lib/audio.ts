let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext;
  if (!AudioCtor) return null;
  if (!ctx) {
    ctx = new AudioCtor();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function tone(frequency: number, duration: number, gain: number, type: OscillatorType): void {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

export function playCollision(intensity: number): void {
  const clamped = Math.min(1, Math.max(0.08, intensity));
  tone(70 + clamped * 40, 0.18, clamped * 0.12, "sine");
}

export function playLaunch(): void {
  tone(180, 0.12, 0.06, "sine");
}

export function playSeated(): void {
  tone(420, 0.5, 0.1, "sine");
  window.setTimeout(() => tone(630, 0.6, 0.08, "sine"), 120);
}

export function playVoided(): void {
  tone(90, 0.6, 0.09, "sine");
}

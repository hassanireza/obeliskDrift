const PROGRESS_KEY = "obelisk-drift:unlocked";
const BEST_KEY = "obelisk-drift:best-launches";

export function getUnlockedCount(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function unlockUpTo(chamberId: number): void {
  if (typeof window === "undefined") return;
  const current = getUnlockedCount();
  if (chamberId > current) {
    window.localStorage.setItem(PROGRESS_KEY, String(chamberId));
  }
}

export function getBestLaunches(chamberId: number): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${BEST_KEY}:${chamberId}`);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function recordBestLaunches(chamberId: number, launches: number): void {
  if (typeof window === "undefined") return;
  const existing = getBestLaunches(chamberId);
  if (existing === null || launches < existing) {
    window.localStorage.setItem(`${BEST_KEY}:${chamberId}`, String(launches));
  }
}

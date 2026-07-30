export function loopingProgressPercent(timeMs: number, offsetMs = 0, cycleMs = 2_800): number {
  const normalized = (((timeMs + offsetMs) % cycleMs) + cycleMs) % cycleMs;
  const phase = normalized / cycleMs;
  const pingPong = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
  return Math.round(pingPong * 100);
}

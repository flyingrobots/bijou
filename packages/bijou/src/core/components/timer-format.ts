import type { TimerOptions } from './timer.part01.js';

/** Format milliseconds as `MM:SS`, `HH:MM:SS`, or `MM:SS.mmm`. */
export function formatTime(ms: number, options: TimerOptions): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(safeMs % 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  let result: string;
  if (options.showHours || hours > 0) {
    const hh = String(hours).padStart(2, '0');
    result = `${hh}:${mm}:${ss}`;
  } else {
    result = `${mm}:${ss}`;
  }

  if (options.showMs) {
    result += `.${String(millis).padStart(3, '0')}`;
  }

  return result;
}

/** Format milliseconds as a human-readable spoken string. */
export function formatSpoken(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0)
    parts.push(`${String(hours)} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0)
    parts.push(`${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${String(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`);

  return parts.join(', ');
}

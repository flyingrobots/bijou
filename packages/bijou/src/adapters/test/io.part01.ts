import type { ClockPort } from '../../ports/clock.js';

import type { IOPort, KeyInputMsg } from '../../ports/io.js';
export interface MockIOOptions {
  /** Pre-loaded answers returned by {@link MockIO.question} in FIFO order. */
  answers?: string[];
  /** Pre-loaded keypress strings delivered by {@link MockIO.rawInput} via microtasks. */
  keys?: string[];
  /** Pre-loaded semantic keys delivered by {@link MockIO.keyInput} via microtasks. */
  keyMsgs?: KeyInputMsg[];
  /** Clock override for deterministic timer and microtask scheduling in tests. */
  clock?: ClockPort;
  /** Virtual filesystem entries (path to content) for {@link MockIO.readFile}. */
  files?: Record<string, string>;
  /** Virtual directory listings (path to entries) for {@link MockIO.readDir}. */
  dirs?: Record<string, string[]>;
}
export interface MockIO extends IOPort {
  /** All strings passed to {@link write} and prompt strings passed to {@link question}. */
  written: string[];
  /** All strings passed to {@link writeError}. */
  writtenErr: string[];
  /** Remaining answers that will be consumed by {@link question}. */
  answerQueue: string[];
  /** Mutable virtual filesystem backing {@link readFile}. */
  files: Record<string, string>;
  /** Mutable virtual directory listing backing {@link readDir}. */
  dirs: Record<string, string[]>;
}

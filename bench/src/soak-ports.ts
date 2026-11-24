/**
 * What the soak bench needs from its host. The bench reaches no Node API
 * itself: a host hands it already-parsed options, a memory reading and a log
 * sink when it creates the app.
 */
export interface SoakOptions {
  /** Cycles through every display scenario before the run quits. */
  readonly cycles: number;
  /** Scenario frames advanced per second. */
  readonly fps: number;
  /** Seconds spent on each scenario. */
  readonly dwell: number;
}

/** Each figure in megabytes, or `undefined` where the host cannot measure it. */
export interface SoakMemory {
  readonly heapUsedMB: number | undefined;
  readonly rssMB: number | undefined;
}

export type SoakMemoryPort = () => SoakMemory;

/** Receives one JSON log line, without its newline. */
export type SoakLogSink = (line: string) => void;

import type { BijouContext } from '@flyingrobots/bijou';

export interface SoakHost {
  readonly options: SoakOptions;
  readonly memory: SoakMemoryPort;
  readonly log: SoakLogSink;
  /**
   * The context a scenario's `setup` renders with, built afresh for each
   * `setup` call. It is not the app's own context.
   */
  readonly scenarioContext: () => BijouContext;
}

export const DEFAULT_SOAK_OPTIONS: SoakOptions = { cycles: Infinity, fps: 30, dwell: 4 };

export function resolveSoakOptions(given: { readonly [K in keyof SoakOptions]?: number | undefined } = {}): SoakOptions {
  return {
    cycles: given.cycles ?? DEFAULT_SOAK_OPTIONS.cycles,
    fps: given.fps ?? DEFAULT_SOAK_OPTIONS.fps,
    dwell: given.dwell ?? DEFAULT_SOAK_OPTIONS.dwell,
  };
}

/** A host that can measure no memory: the bench shows no memory row. */
export const NO_MEMORY: SoakMemoryPort = () => ({ heapUsedMB: undefined, rssMB: undefined });

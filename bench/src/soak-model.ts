export interface SoakModel {
  readonly scenarioIndex: number;
  readonly scenarioState: unknown;
  readonly frameIndex: number;
  frameTimes: number[];
  readonly cycle: number;
  readonly elapsedMs: number;
  readonly paneWidth: number;
  readonly paneHeight: number;
  readonly showPerf: boolean;
}

export type SoakMsg =
  | { readonly type: 'advance-scenario' }
  | { readonly type: 'toggle-perf' };

// Shared latest pane dimensions, retained across app construction as before.
export const latestPaneSize = { width: 0, height: 0 };

/** Sentinel symbol signaling that the application should quit. */
export const QUIT: unique symbol = Symbol('QUIT');

export type QuitSignal = typeof QUIT;

/** Disposable cleanup handle returned by long-lived command effects. */
export interface CmdDisposable {
  dispose(): void;
}

export type CmdCleanup = CmdDisposable | (() => void);
export type CmdResult<M> = M | QuitSignal | CmdCleanup | undefined;

export function isCmdDisposable(value: unknown): value is CmdDisposable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  );
}

export function isCmdCleanup(value: unknown): value is CmdCleanup {
  return typeof value === 'function' || isCmdDisposable(value);
}

/** A side effect that can emit messages back to the application. */
export type Cmd<M> = (
  emit: (msg: M) => void,
  capabilities: CmdCapabilities,
) => CmdResult<M> | Promise<CmdResult<M>>;

/** Capabilities provided to commands by the runtime. */
export interface CmdCapabilities {
  onPulse(handler: (dt: number) => void): CmdDisposable;
  sleep?(ms: number): Promise<void>;
  defer?(): Promise<void>;
  now?(): number;
}

export type RuntimeIssueLevel = 'warning' | 'error';
export type RuntimeIssueSource = 'command' | 'eventbus' | 'runtime';

/** Framework-level issue routed alongside normal app messages when supported. */
export interface RuntimeIssue {
  readonly level: RuntimeIssueLevel;
  readonly source: RuntimeIssueSource;
  readonly message: string;
  readonly atMs: number;
  readonly error?: unknown;
}

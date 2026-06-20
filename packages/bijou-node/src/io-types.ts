import type { ClockPort, IOPort } from '@flyingrobots/bijou';

/** Optional overrides for `nodeIO`. */
export interface NodeIOOptions {
  /** Clock override for deterministic timer scheduling in tests. */
  clock?: ClockPort;
  /** Writable stdout override for deterministic host tests. */
  stdout?: NodeWriteStream;
  /** Writable stderr override for deterministic host tests. */
  stderr?: NodeWriteStream;
}

export interface NodeWriteStream {
  write(data: string | Uint8Array): unknown;
}

export interface ScopedNodeIOOptions extends NodeIOOptions {
  /** Root directory that all file access must stay inside. */
  readonly root: string;
  /** Optional base adapter for stdout/stdin/timer behavior. Defaults to `nodeIO`. */
  readonly baseIO?: IOPort;
}

export interface ScopedNodeIO extends IOPort {
  /** Absolute root directory that constrains filesystem access. */
  readonly root: string;
  /** Resolve a relative or absolute path and reject anything outside `root`. */
  resolvePath(path: string): string;
}

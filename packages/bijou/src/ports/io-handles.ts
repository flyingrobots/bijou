/** Disposable handle returned by raw-input or resize listeners. */
export interface RawInputHandle {
  /** Remove the listener and release resources. */
  dispose(): void;
}

/** Disposable handle returned by interval timers. */
export interface TimerHandle {
  /** Cancel the timer. */
  dispose(): void;
}

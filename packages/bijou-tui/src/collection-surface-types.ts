export interface CachedMarqueeLine {
  readonly visibleWidth: number;
  readonly cells: readonly string[];
}

export type SelectedRowOverflow =
  | 'clip'
  | {
    readonly mode: 'marquee';
    readonly elapsedMs: number;
    readonly stepMs?: number;
    readonly startDelayMs?: number;
    readonly endDelayMs?: number;
  };

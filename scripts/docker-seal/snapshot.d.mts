export interface CapturedSnapshot {
  readonly directory: string;
  readonly archive: Buffer;
  readonly source: string;
  readonly sourceBytes: number;
  readonly digest: string;
}
export interface SnapshotOptions {
  readonly generatedBudget?: number;
  readonly signal?: AbortSignal;
  readonly sourceIndex?: string;
  readonly fullPush?: boolean;
}
export interface CaptureBoundary extends SnapshotOptions {
  readonly measurementPath: string;
}
export function snapshot(root: string, command: readonly string[], stdin: Buffer,
  options?: SnapshotOptions): Promise<CapturedSnapshot>;
export function captureSnapshot(root: string, command: readonly string[], stdin: Buffer,
  boundary: CaptureBoundary): Promise<CapturedSnapshot>;

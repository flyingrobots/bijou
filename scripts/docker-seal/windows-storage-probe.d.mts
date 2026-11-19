export interface StorageProbeVerdict {
  readonly verdict: 'boundary-at-requested-size' | 'boundary-above-requested-size' | 'ceiling-reached'
    | 'refused-for-another-reason' | 'incomplete';
  readonly requestedBytes: number;
  readonly capacityBytes: number;
  readonly freeAtStartBytes: number;
  readonly writtenBytes: number;
  readonly freeAtEndBytes: number;
  readonly hresult: string | null;
  readonly user: string;
}
export function storageProbeProgram(ceilingBytes: number): string;
export function judgeStorageProbe(output: string, requestedBytes: number): StorageProbeVerdict;

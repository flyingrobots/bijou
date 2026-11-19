export interface WindowsUsage {
  readonly capacityBytes: number;
  readonly usedBytes: number | undefined;
  readonly backingFree: number;
}
export function validateWindowsUsage(current: WindowsUsage, baseline: WindowsUsage, backingGrowth: number, limit: number): number;

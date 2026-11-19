export interface WindowsUsage {
  readonly capacityBytes: number;
  readonly usedBytes: number | undefined;
  readonly backingFree: number;
}
export function validateWindowsUsage(current: WindowsUsage, baseline: WindowsUsage, backingGrowth: number, limit: number, budget: string): number;
export function windowsUsageGrowth(current: WindowsUsage, baseline: WindowsUsage, backingGrowth: number): { volumeGrowth: number; backingGrowth: number };

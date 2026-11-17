export interface WindowsUsage {
  readonly owners: Readonly<Record<string, number>>;
  readonly backingFree: number;
}
export function validateWindowsUsage(current: WindowsUsage, baseline: WindowsUsage, backingGrowth: number, limit: number): number;

export interface JobRecord {
  readonly name: string;
  readonly start: string | null;
  readonly end: string | null;
  readonly conclusion: string | null;
}
export function wallSeconds(start: string | null | undefined, end: string | null | undefined): number | null;
export function formatDuration(seconds: number): string;
export function renderSummary(jobs: readonly JobRecord[]): string;

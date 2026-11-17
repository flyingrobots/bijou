export const quotaProbeUsers: readonly string[];
export const quotaProbeProgram: string;
export function probeQuota(run: (user: string, program: string) => Promise<string>): Promise<string>;
export function hostQuotaProbeProgram(volume: string): string;
export function probeHostQuota(volume: string, run: (program: string) => Promise<string>): Promise<string>;

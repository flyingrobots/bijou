export const quotaProbeUsers: readonly string[];
export const quotaProbeProgram: string;
export function probeQuota(run: (user: string, program: string) => Promise<string>): Promise<string>;

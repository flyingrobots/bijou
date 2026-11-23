export interface LockfileShape { readonly packages?: Readonly<Record<string, { readonly resolved?: unknown } | undefined>> }
export function localTarballs(lock: LockfileShape): string[];
export function copyLocalTarballs(lock: LockfileShape, source: string, target: string): string[];

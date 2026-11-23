/** Repository paths of every tarball `lock` (a parsed package-lock.json) resolves with `file:`. */
export function localTarballs(lock: unknown): string[];
export function copyLocalTarballs(lock: unknown, source: string, target: string): string[];

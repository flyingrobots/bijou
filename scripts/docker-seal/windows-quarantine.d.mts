export function requireWindowsBootstrapClear(): void;
export function windowsBootstrapQuarantined(): boolean;
export function withWindowsDaemonCustody<T>(details: Readonly<Record<string, unknown>>, operation: () => Promise<T>): Promise<T>;

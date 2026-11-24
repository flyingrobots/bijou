/** Why a worker with a custody marker cannot start: a run in progress, or one that needs recovery. */
export function markerRefusal(name: string, marker: string): string;
/** Reject when the named worker has a custody marker or is running. */
export function assertWorkerFree(name: string): Promise<void>;

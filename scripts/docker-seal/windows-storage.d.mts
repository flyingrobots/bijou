export interface WorkerStorage {
  readonly capacityBytes: number;
  readonly usedBytes: number;
  readonly processes: number;
}
export const storageMeasureProgram: string;
export const storageContract: {
  readonly requestedSize: string;
  readonly enforcement: string;
  readonly maximumCapacityBytes: number;
  readonly demonstration: string;
  readonly accounting: string;
  readonly limits: string;
};
export function parseWorkerStorage(output: string): WorkerStorage;

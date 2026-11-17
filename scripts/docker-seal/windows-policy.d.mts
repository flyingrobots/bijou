export interface WindowsWorkerInspection {
  readonly Config: { readonly Labels?: Readonly<Record<string, string>> };
  readonly Mounts: readonly unknown[];
  readonly HostConfig: {
    readonly Binds?: readonly string[];
    readonly VolumesFrom?: readonly string[];
    readonly Privileged?: boolean;
    readonly Devices?: readonly unknown[];
    readonly DeviceRequests?: readonly unknown[];
    readonly SecurityOpt?: readonly string[];
    readonly NetworkMode: string;
    readonly CpuCount: number;
    readonly Memory: number;
    readonly StorageOpt?: { readonly size?: string };
    readonly Isolation: string;
  };
  readonly NetworkSettings: { readonly Networks: Readonly<Record<string, unknown>> };
}
export function validateWindowsWorker(worker: WindowsWorkerInspection, offline: boolean): void;

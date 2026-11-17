export const hostVolumeInventory: {
  readonly label: string;
  readonly argv: readonly string[];
  readonly timeout: number;
};
export function parseHostVolumes(output: string): string[];
export function parseContainerVolume(output: string, hostVolumes: readonly string[]): string;

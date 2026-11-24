/** One entry of `/sys/class/net`: a network device, or a control file such as `bonding_masters`. */
export interface NetworkEntry {
  readonly name: string;
  /** False for a control file, which is not a network device. */
  readonly device: boolean;
  /** Administratively up. A device whose flags cannot be read counts as up. */
  readonly up: boolean;
}
export function readNetworkEntries(root?: string): NetworkEntry[];

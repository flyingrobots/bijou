import type { NetworkEntry } from './network-entries.mjs';

export interface KernelSealFacts {
  readonly dockerFile: boolean;
  readonly marker: string;
  readonly sockets: readonly string[];
  readonly interfaces: readonly NetworkEntry[];
  readonly mountInfo: string;
}
export function verifyKernelSeal(facts: KernelSealFacts): void;

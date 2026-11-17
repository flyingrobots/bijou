export interface KernelSealFacts {
  readonly dockerFile: boolean;
  readonly marker: string;
  readonly sockets: readonly string[];
  readonly interfaces: readonly string[];
  readonly mountInfo: string;
}
export function verifyKernelSeal(facts: KernelSealFacts): void;

export interface VitestShard {
  readonly index: number;
  readonly count: number;
}

export function parseShard(raw: string | undefined): VitestShard | undefined;
export function chunkFiles(files: readonly string[], size: number): string[][];
export function isIncludedTestFile(path: string): boolean;

export interface VitestWeights {
  readonly defaultSeconds: number;
  readonly perFileSeconds: number;
  readonly sharedPerFileSeconds: number;
  readonly files: Readonly<Record<string, number>>;
}

export function assignShards(
  files: readonly string[],
  weights: VitestWeights,
  count: number,
  isolated?: ReadonlySet<string>,
): { files: string[]; seconds: number }[];
export function needsIsolation(source: string): boolean;
export function parseWeights(text: string): VitestWeights;

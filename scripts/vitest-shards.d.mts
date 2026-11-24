export interface VitestShard {
  readonly index: number;
  readonly count: number;
}

export function parseShard(raw: string | undefined): VitestShard | undefined;
export function chunkFiles(files: readonly string[], size: number): string[][];
export function selectShard(chunks: readonly (readonly string[])[], shard: VitestShard | undefined): string[][];
export function isIncludedTestFile(path: string): boolean;

// Shard selection for the full Vitest suite. Pure: no file access, no process state.
// The suite runs in chunks of files; a shard is every chunk whose position, counted
// from zero, leaves the remainder index - 1 when divided by the shard count. Chunks
// are dealt out in turn so each shard gets a spread of directories, not one block.

/** Parse `BIJOU_VITEST_SHARD`: `k/n` with 1 <= k <= n, or nothing for the whole suite. */
export function parseShard(raw) {
  if (raw == null || raw === '') return undefined;
  const match = /^([1-9]\d*)\/([1-9]\d*)$/u.exec(raw);
  const index = match ? Number(match[1]) : Number.NaN;
  const count = match ? Number(match[2]) : Number.NaN;
  if (!match || index > count) {
    throw new Error(`BIJOU_VITEST_SHARD must be k/n with 1 <= k <= n, got ${JSON.stringify(raw)}`);
  }
  return { index, count };
}

export function chunkFiles(files, size) {
  const chunks = [];
  for (let start = 0; start < files.length; start += size) chunks.push(files.slice(start, start + size));
  return chunks;
}

/** The chunks one shard runs; every chunk when there is no shard. */
export function selectShard(chunks, shard) {
  if (shard == null) return chunks.map((chunk) => [...chunk]);
  return chunks.filter((_, position) => position % shard.count === shard.index - 1).map((chunk) => [...chunk]);
}

export function isIncludedTestFile(path) {
  return (
    /^packages\/[^/]+\/src\/.*\.test\.ts$/u.test(path)
    || /^bench\/src\/.*\.test\.ts$/u.test(path)
    || /^scripts\/.*\.test\.ts$/u.test(path)
    || /^tests\/.*\.test\.ts$/u.test(path)
  );
}

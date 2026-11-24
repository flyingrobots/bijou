// Shard selection for the full Vitest suite. Pure: no file access, no process state.
// A shard is a share of the suite's test files, dealt by measured weight so the
// shards take similar time; each shard then runs its files in chunks.

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

/**
 * Deal the files into `count` shards of similar total weight: heaviest file first, each to the
 * shard that is lightest so far (ties to the lower shard). A file with no measured weight counts
 * `weights.defaultSeconds`, and every file also counts `weights.perFileSeconds` for the start-up and
 * import cost a test file has before its first test runs. Every file lands in exactly one shard whatever the weights say, so a
 * stale or wrong weights file can make the shards uneven but can never drop or repeat a test.
 */
export function assignShards(files, weights, count) {
  const seconds = (file) => (weights.files[file] ?? weights.defaultSeconds) + weights.perFileSeconds;
  const ordered = [...files].sort((a, b) => seconds(b) - seconds(a) || a.localeCompare(b));
  const shards = Array.from({ length: count }, () => ({ files: [], seconds: 0 }));
  for (const file of ordered) {
    let lightest = shards[0];
    for (const shard of shards) if (shard.seconds < lightest.seconds) lightest = shard;
    lightest.files.push(file);
    lightest.seconds += seconds(file);
  }
  return shards.map((shard) => ({ files: shard.files.sort(), seconds: Math.round(shard.seconds * 10) / 10 }));
}

/** Read a `bijou.vitest-weights/1` document; anything else is refused. */
export function parseWeights(text) {
  const parsed = JSON.parse(text);
  const files = parsed?.files;
  const valid = parsed?.schema === 'bijou.vitest-weights/1'
    && typeof parsed.defaultSeconds === 'number' && parsed.defaultSeconds > 0
    && typeof parsed.perFileSeconds === 'number' && parsed.perFileSeconds >= 0
    && files != null && typeof files === 'object' && !Array.isArray(files)
    && Object.values(files).every((value) => typeof value === 'number' && value >= 0);
  if (!valid) throw new Error('scripts/vitest-weights.json is not a bijou.vitest-weights/1 document');
  return { defaultSeconds: parsed.defaultSeconds, perFileSeconds: parsed.perFileSeconds, files };
}

export function isIncludedTestFile(path) {
  return (
    /^packages\/[^/]+\/src\/.*\.test\.ts$/u.test(path)
    || /^bench\/src\/.*\.test\.ts$/u.test(path)
    || /^scripts\/.*\.test\.ts$/u.test(path)
    || /^tests\/.*\.test\.ts$/u.test(path)
  );
}

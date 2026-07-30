export interface FileContextBaseline {
  readonly schema: 'code-dojo.file-context-baseline.v1';
  readonly maxLines: number;
  readonly maxBytes: number;
  readonly files: readonly FileContextBaselineEntry[];
}

interface FileContextBaselineEntry {
  readonly path: string;
  readonly lines: number;
  readonly bytes: number;
}

type ReadSource = (path: string) => string | undefined;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function parseFileContextBaseline(
  source: string,
): FileContextBaseline {
  const parsed: unknown = JSON.parse(source);
  if (
    !isRecord(parsed)
    || parsed.schema !== 'code-dojo.file-context-baseline.v1'
    || !isPositiveInteger(parsed.maxLines)
    || !isPositiveInteger(parsed.maxBytes)
    || !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  const paths = new Set<string>();
  const files = parsed.files.map((entry: unknown) => {
    if (
      !isRecord(entry)
      || typeof entry.path !== 'string'
      || entry.path.length === 0
      || !isNonNegativeInteger(entry.lines)
      || !isNonNegativeInteger(entry.bytes)
      || paths.has(entry.path)
    ) {
      throw new Error('invalid file/context baseline entry');
    }
    paths.add(entry.path);
    return {
      path: entry.path,
      lines: entry.lines,
      bytes: entry.bytes,
    };
  });
  return {
    schema: parsed.schema,
    maxLines: parsed.maxLines,
    maxBytes: parsed.maxBytes,
    files,
  };
}

export function validateLiveFileContextBaseline(
  baseline: FileContextBaseline,
  readSource: ReadSource,
): void {
  for (const entry of baseline.files) {
    const source = readSource(entry.path);
    if (source === undefined) {
      throw new Error(`missing file/context baseline path: ${entry.path}`);
    }
    const lines = source.split(/\r?\n/u).length;
    const bytes = Buffer.byteLength(source, 'utf8');
    if (lines !== entry.lines || bytes !== entry.bytes) {
      throw new Error(`stale file/context baseline metrics: ${entry.path}`);
    }
    if (lines <= baseline.maxLines && bytes <= baseline.maxBytes) {
      throw new Error(`file/context baseline path is below threshold: ${
        entry.path
      }`);
    }
  }
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0;
}

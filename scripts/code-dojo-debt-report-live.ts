import { isNonNegativeInteger } from './code-dojo-debt-baselines.js';

export interface CodeDojoLiveFile {
  readonly path: string;
  readonly count: number;
}

export interface CodeDojoLiveInput {
  readonly eslintViolations: number;
  readonly eslintFiles: readonly CodeDojoLiveFile[] | null;
}

const LIVE_SCHEMA = 'code-dojo.eslint-live.v1';

/** Validates a live ESLint measurement artifact (the #369 hand-off). */
export function parseCodeDojoLiveInput(value: unknown): CodeDojoLiveInput {
  if (!isRecord(value) || value['schema'] !== LIVE_SCHEMA) {
    throw new Error(`live input is not a ${LIVE_SCHEMA} document`);
  }
  const eslintViolations = value['eslintViolations'];
  if (!isNonNegativeInteger(eslintViolations)) {
    throw new Error('live input eslintViolations must be a non-negative integer');
  }
  const files = value['eslintFiles'];
  if (files === null) return { eslintViolations, eslintFiles: null };
  if (!Array.isArray(files)) {
    throw new Error('live input eslintFiles must be an array or null');
  }
  return { eslintViolations, eslintFiles: files.map(parseFile) };
}

function parseFile(entry: unknown): CodeDojoLiveFile {
  if (!isRecord(entry) || typeof entry['path'] !== 'string' || !isNonNegativeInteger(entry['count'])) {
    throw new Error('live input file entries need a path and a non-negative integer count');
  }
  return { path: entry['path'], count: entry['count'] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

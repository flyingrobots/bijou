import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface CodeDojoBaselineCounts {
  readonly fileContextEntries: readonly unknown[];
  readonly mockBanViolations: readonly unknown[];
  readonly eslintViolations: number;
}

const fileContextBaselinePath = 'scripts/code-dojo/baselines/file-context.json';
const mockBanBaselinePath = 'scripts/code-dojo/baselines/mock-ban.json';
const eslintBaselinePath = 'scripts/code-dojo/baselines/eslint.json';

export function loadCodeDojoBaselineCounts(root: string): CodeDojoBaselineCounts {
  return {
    fileContextEntries: readArrayBaseline(
      resolve(root, fileContextBaselinePath),
      'code-dojo.file-context-baseline.v1',
      'files',
    ),
    mockBanViolations: readArrayBaseline(
      resolve(root, mockBanBaselinePath),
      'code-dojo.mock-ban-baseline.v1',
      'violations',
    ),
    eslintViolations: readEslintViolationCount(resolve(root, eslintBaselinePath)),
  };
}

function readArrayBaseline(path: string, schema: string, key: string): readonly unknown[] {
  const parsed = readJsonObject(path);
  const values = parsed[key];
  if (parsed.schema !== schema || !Array.isArray(values)) {
    throw new Error(`${path} is not a ${schema} file`);
  }
  return values;
}

function readEslintViolationCount(path: string): number {
  const parsed = readJsonObject(path);
  const total = parsed.total;
  if (parsed.schema !== 'code-dojo.eslint-baseline.v1' || typeof total !== 'number' || !Number.isInteger(total)) {
    throw new Error(`${path} is not a code-dojo.eslint-baseline.v1 file`);
  }
  return total;
}

function readJsonObject(path: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(parsed)) {
    throw new Error(`${path} must be a JSON object`);
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

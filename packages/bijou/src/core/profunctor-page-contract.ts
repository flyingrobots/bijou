import { failPageTarget } from './profunctor-page-error.js';
import {
  expectString,
  expectStringRecord,
  type JsonRecord,
} from './profunctor-page-json.js';

const DIGEST = /^sha256:[0-9a-f]{64}$/;
export const TOKEN_REFERENCE_PREFIX = 'semantic.';

export function expectExactKeys(
  record: JsonRecord,
  path: string,
  required: readonly string[],
  optional: readonly string[] = [],
): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of required) {
    if (!Object.hasOwn(record, key)) {
      invalid(`${path}.${key}`, 'missing required field');
    }
  }
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      invalid(`${path}.${key}`, 'field is not owned by this contract');
    }
  }
}

export function expectContractId(
  value: unknown,
  path: string,
  prefix: string,
): string {
  const result = expectString(value, path);
  if (
    !result.startsWith(prefix)
    || result.length === prefix.length
    || /\s/u.test(result)
  ) {
    invalid(path, `expected ${prefix} identity`);
  }
  return result;
}

export function expectTokenReferences(
  value: unknown,
  path: string,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(expectStringRecord(value, path)).map(([key, token]) => [
      key,
      expectContractId(token, `${path}.${key}`, TOKEN_REFERENCE_PREFIX),
    ]),
  );
}

export function expectDigest(value: unknown, path: string): string {
  const result = expectString(value, path);
  if (!DIGEST.test(result)) {
    invalid(path, 'expected sha256 digest');
  }
  return result;
}

export function expectNonWhitespaceString(
  value: unknown,
  path: string,
): string {
  const result = expectString(value, path);
  if (/\s/u.test(result)) {
    invalid(path, 'expected string without whitespace');
  }
  return result;
}

export function expectRepositoryPath(value: unknown, path: string): string {
  const result = expectString(value, path);
  const segments = result.split('/');
  if (
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(result)
    || result.includes('\\')
    || result.includes('\u0000')
    || segments.some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    invalid(path, 'expected repository-relative source path');
  }
  return result;
}

export function expectRoute(value: unknown, path: string): string {
  const result = expectString(value, path);
  if (
    !/^\/(?:[^/?#]+\/)*$/.test(result)
    || /[\s\p{Cc}]/u.test(result)
  ) {
    invalid(path, 'expected canonical trailing-slash route');
  }
  return result;
}

export function expectKebabCase(value: unknown, path: string): string {
  const result = expectString(value, path);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(result)) {
    invalid(path, 'expected kebab-case identifier');
  }
  return result;
}

export function expectIntegerAtLeast(
  value: unknown,
  path: string,
  minimum: number,
): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < minimum) {
    invalid(path, `expected integer >= ${String(minimum)}`);
  }
  return value;
}

export function expectHttpUrl(value: unknown, path: string): string {
  const result = expectString(value, path);
  let parsed: URL;
  try {
    parsed = new URL(result);
  } catch {
    invalid(path, 'expected absolute HTTP or HTTPS URL');
  }
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    || parsed.username !== ''
    || parsed.password !== ''
    || /\s/u.test(result)
  ) {
    invalid(path, 'expected credential-free HTTP or HTTPS URL');
  }
  return result;
}

function invalid(path: string, detail: string): never {
  failPageTarget('BIJOU_PAGE_INPUT_REFERENCE_INVALID', path, detail);
}

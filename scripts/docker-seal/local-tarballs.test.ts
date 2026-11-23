import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { localTarballs, type LockfileShape } from './local-tarballs.mjs';

const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8')) as LockfileShape;
const entry = (resolved: string): LockfileShape => ({ packages: { 'node_modules/x': { resolved } } });

describe('dependency worker local tarballs', () => {
  it('lists the vendored Geordi tarballs the lockfile resolves', () => {
    expect(localTarballs(lock)).toEqual([
      'examples/web-gpu/vendor/flyingrobots-geordi-bijou-gpu-0.1.0.tgz',
      'examples/web-gpu/vendor/flyingrobots-geordi-core-0.1.0.tgz',
    ]);
  });

  it('ignores registry and workspace entries', () => {
    expect(localTarballs({ packages: { a: { resolved: 'https://registry.npmjs.org/a/-/a-1.0.0.tgz' }, b: {} } })).toEqual([]);
  });

  it.each(['file:../outside.tgz', 'file:/abs/x.tgz', 'file:a/../../x.tgz', 'file:C:/x.tgz', 'file:packages/dir'])(
    'refuses %s', (resolved) => {
      expect(() => localTarballs(entry(resolved))).toThrow('Unsupported local dependency');
    },
  );
});

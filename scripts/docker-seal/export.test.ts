import { describe, expect, it } from 'vitest';
import { validateExportPath } from './export.mjs';

describe('artifact export admission', () => {
  it.each(['../config', '/tmp/report', 'report/../../config', 'report\\config',
    '.git/config', 'report/.env', 'report/.npmrc', 'node_modules/package.json',
    'report//part', './report', '', 'report\0suffix'])(
    'refuses an artifact path that could escape or expose internals: %s', (path) => {
      expect(() => validateExportPath(path)).toThrow('relative artifact path');
    },
  );

  it('preserves ordinary nested artifact paths without shell interpretation', () => {
    expect(validateExportPath('audit/component report.json')).toBe('audit/component report.json');
    expect(validateExportPath('packages/bijou/package.tgz')).toBe('packages/bijou/package.tgz');
  });
});

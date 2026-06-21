import { describe, expect, it } from 'vitest';
import { parseStringTable, type StringTable } from '../packages/bijou-i18n-tools/src/index.js';
import { evaluateDogfoodI18nCompleteness, evaluateDogfoodI18nMissingTranslationRatchet, runDogfoodI18nCompleteness } from './dogfood-i18n-completeness.js';

function table(rows: readonly string[]): StringTable {
  return parseStringTable([
    'namespace,id,kind,sourceLocale,sourceValueKind,sourceValue,locale,valueKind,value,status,description',
    ...rows,
  ].join('\n'), 'csv');
}

function row(
  id: string,
  sourceValue: string,
  locale: string,
  value: string,
  status: 'current' | 'missing' | 'stale',
): string {
  const valueKind = value === '' ? '' : 'string';
  return [
    'bijou.dogfood',
    id,
    'message',
    'en',
    'string',
    sourceValue,
    locale,
    valueKind,
    value,
    status,
    '',
  ].join(',');
}

describe('DOGFOOD i18n completeness gate', () => {
  it('treats translation-only edits as changed localization keys that need all locales current', () => {
      const base = table([
        row('changed.title', 'Title', 'en', 'Title', 'current'),
        row('changed.title', 'Title', 'fr', 'Ancien titre', 'current'),
        row('changed.title', 'Title', 'es', '', 'missing'),
        row('changed.title', 'Title', 'de', 'Titel', 'current'),
      ]);
      const current = table([
        row('changed.title', 'Title', 'en', 'Title', 'current'),
        row('changed.title', 'Title', 'fr', 'Titre', 'current'),
        row('changed.title', 'Title', 'es', '', 'missing'),
        row('changed.title', 'Title', 'de', 'Titel', 'current'),
      ]);

      const result = evaluateDogfoodI18nCompleteness({
        table: current,
        baseTable: base,
        locales: ['en', 'fr', 'es', 'de'],
      });

      expect(result).toMatchObject({
        ok: false,
        checked: 1,
        issues: [{
          namespace: 'bijou.dogfood',
          id: 'changed.title',
          locale: 'es',
          reason: 'status is missing',
        }],
      });
    });

  it('ratchets the full number of missing translations by locale', () => {
      const current = table([
        row('existing.title', 'Existing title', 'en', 'Existing title', 'current'),
        row('existing.title', 'Existing title', 'fr', '', 'missing'),
        row('existing.title', 'Existing title', 'es', 'Titulo existente', 'current'),
        row('existing.title', 'Existing title', 'de', '', 'missing'),
      ]);

      const result = evaluateDogfoodI18nMissingTranslationRatchet({
        table: current,
        locales: ['en', 'fr', 'es', 'de'],
        baseline: {
          total: 1,
          byLocale: {
            fr: 1,
            de: 0,
          },
        },
      });

      expect(result).toMatchObject({
        ok: false,
        total: 2,
        byLocale: [
          { locale: 'fr', count: 1 },
          { locale: 'de', count: 1 },
        ],
        violations: [
          'missing translations 2 exceeds baseline 1',
          'missing translations de 1 exceeds baseline 0',
        ],
      });
    });

  it('returns a failing CLI exit code with a concrete issue list', () => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const exitCode = runDogfoodI18nCompleteness({
        table: table([
          row('new.title', 'New title', 'en', 'New title', 'current'),
          row('new.title', 'New title', 'fr', '', 'missing'),
        ]),
        baseTable: table([]),
        locales: ['en', 'fr'],
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr.join('')).toContain('bijou.dogfood:new.title [fr] status is missing');
    });

  it('reports malformed CLI usage when --base has no value', () => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      const exitCode = runDogfoodI18nCompleteness({
        args: ['--base'],
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      });

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr.join('')).toContain('missing value for --base');
    });
});

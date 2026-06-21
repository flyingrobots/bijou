import { describe, expect, it } from 'vitest';
import { parseStringTable, type StringTable } from '../packages/bijou-i18n-tools/src/index.js';
import { evaluateDogfoodI18nCompleteness } from './dogfood-i18n-completeness.js';

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
  it('requires every newly introduced source string to have current supported-locale rows', () => {
      const base = table([
        row('existing.title', 'Existing title', 'en', 'Existing title', 'current'),
        row('existing.title', 'Existing title', 'fr', '', 'missing'),
        row('existing.title', 'Existing title', 'es', '', 'missing'),
        row('existing.title', 'Existing title', 'de', '', 'missing'),
      ]);
      const current = table([
        row('existing.title', 'Existing title', 'en', 'Existing title', 'current'),
        row('existing.title', 'Existing title', 'fr', '', 'missing'),
        row('existing.title', 'Existing title', 'es', '', 'missing'),
        row('existing.title', 'Existing title', 'de', '', 'missing'),
        row('new.title', 'New title', 'en', 'New title', 'current'),
        row('new.title', 'New title', 'fr', 'Nouveau titre', 'current'),
        row('new.title', 'New title', 'es', 'Titulo nuevo', 'current'),
        row('new.title', 'New title', 'de', 'Neuer Titel', 'current'),
      ]);

      const result = evaluateDogfoodI18nCompleteness({
        table: current,
        baseTable: base,
        locales: ['en', 'fr', 'es', 'de'],
      });

      expect(result).toMatchObject({
        ok: true,
        checked: 1,
        issues: [],
      });
    });

  it('fails when a newly introduced source string leaves a supported locale missing', () => {
      const base = table([]);
      const current = table([
        row('new.title', 'New title', 'en', 'New title', 'current'),
        row('new.title', 'New title', 'fr', 'Nouveau titre', 'current'),
        row('new.title', 'New title', 'es', '', 'missing'),
        row('new.title', 'New title', 'de', 'Neuer Titel', 'current'),
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
          id: 'new.title',
          locale: 'es',
          reason: 'status is missing',
        }],
      });
    });

  it('treats source-value edits as changed strings that need current translations', () => {
      const base = table([
        row('changed.title', 'Old title', 'en', 'Old title', 'current'),
        row('changed.title', 'Old title', 'fr', 'Ancien titre', 'current'),
        row('changed.title', 'Old title', 'es', 'Titulo anterior', 'current'),
        row('changed.title', 'Old title', 'de', 'Alter Titel', 'current'),
      ]);
      const current = table([
        row('changed.title', 'New title', 'en', 'New title', 'current'),
        row('changed.title', 'New title', 'fr', 'Nouveau titre', 'current'),
        row('changed.title', 'New title', 'es', 'Titulo anterior', 'stale'),
        row('changed.title', 'New title', 'de', 'Neuer Titel', 'current'),
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
          reason: 'status is stale',
        }],
      });
    });
});

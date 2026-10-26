import { describe, expect, it } from 'vitest';
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
} from '../../../packages/bijou-i18n/src/index.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { dogfoodMissingLocalizationMessage } from '../../../examples/docs/i18n/missing-localization.js';

const IDS = [
  'themeLab.activeShell', 'themeLab.activeShell.numbered', 'themeLab.editedName',
  'themeLab.keys.blue', 'themeLab.keys.green', 'themeLab.keys.red',
  'themeLab.keys.next', 'themeLab.keys.previous', 'themeLab.keys.nudgeDown',
  'themeLab.keys.nudgeUp', 'themeLab.keys.reset', 'themeLab.picker.hint',
  'themeLab.pickerTitle', 'themeLab.previewTitle', 'themeLab.provenanceTitle',
  'themeLab.preview.accent', 'themeLab.preview.alertWarning', 'themeLab.preview.error',
  'themeLab.preview.info', 'themeLab.preview.success', 'themeLab.preview.warning',
  'themeLab.preview.separator', 'themeLab.provenance.considered',
  'themeLab.provenance.defersTo', 'themeLab.provenance.field',
  'themeLab.provenance.literal', 'themeLab.provenance.literalNote',
  'themeLab.provenance.none', 'themeLab.provenance.override',
  'themeLab.provenance.reference', 'themeLab.provenance.rule',
  'themeLab.provenance.score', 'themeLab.provenance.skipped', 'themeLab.provenance.won',
] as const;

describe('Theme Lab runtime messages', () => {
  it.each([
    ['en', 'Why this value'], ['de', 'Warum dieser Wert'],
    ['es', 'Por qué este valor'], ['fr', 'Pourquoi cette valeur'],
  ])('resolves the complete %s message set without fallback or missing markers', (locale, title) => {
    const runtime = createI18nRuntime({
      locale,
    direction: 'ltr',
      fallbackLocale: 'en',
      fallbackCatalogs: dogfoodI18nCatalogsForLocale('en'),
      missingMessage: dogfoodMissingLocalizationMessage,
    });
    for (const catalog of dogfoodI18nCatalogsForLocale(locale)) runtime.loadCatalog(catalog);
    const localization = createRuntimeLocalizationPort(runtime);
    for (const id of IDS) {
      const result = localization.resolve({
        key: { namespace: 'bijou.dogfood', id },
        values: {
          name: 'Demo', label: 'Active', index: 1, count: 2,
          rule: 'best-contrast', hex: '#123456', dependency: 'source', path: 'semantic.accent',
        },
      });
      expect(result.status, `${locale}: ${id}`).toBe('translated');
      expect(result.issues, `${locale}: ${id}`).toEqual([]);
      expect(typeof result.value).toBe('string');
    }
    expect(localization.resolve({
      key: { namespace: 'bijou.dogfood', id: 'themeLab.provenanceTitle' },
    }).value).toBe(title);
  });
});

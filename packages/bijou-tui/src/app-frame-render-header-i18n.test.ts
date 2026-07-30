import { createI18nRuntime } from '@flyingrobots/bijou-i18n';
import { describe, expect, it } from 'vitest';
import { FRAME_I18N_CATALOG } from './app-frame-i18n.js';
import {
  frameModel,
  frameOptions,
  panePage,
  resolveHeaderLine,
  surfacePlainText,
} from './app-frame-render.test-support.js';

describe('resolveHeaderLine localization', () => {
  it('localizes the default frame title', () => {
    const i18n = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
    i18n.loadCatalog(FRAME_I18N_CATALOG);
    i18n.loadCatalog({
      namespace: 'bijou.shell',
      entries: [{
        key: { namespace: 'bijou.shell', id: 'header.title' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'App', fr: 'Application' },
      }],
    });
    const page = panePage('home', 'Home', {});
    const header = resolveHeaderLine(
      frameModel({
        activePageId: 'home',
        pageOrder: ['home'],
        pageModels: { home: {} },
      }),
      frameOptions([page], { i18n }),
      new Map([['home', page]]),
    );

    expect(surfacePlainText(header.surface)).toMatch(/^Application\s/u);
  });
});

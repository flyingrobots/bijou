
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  DOGFOOD_I18N_CATALOG,
  expect,
  FRAME_I18N_CATALOG,
  frameText,
  it,
  KEY_ENTER,
  pseudoLocalize,
  runScript,
  withLocaleValues,
  wrapPageMsg,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('accepts localized shell and DOGFOOD catalogs for landing and onboarding copy', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
        withLocaleValues(FRAME_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const landing = await runScript(app, [], { ctx });
    expect(frameText(must(landing.frames.at(-1)))).toContain(pseudoLocalize('Press [Enter]'));

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    const text = frameText(must(entered.frames.at(-1)));
    expect(text).toContain(pseudoLocalize('Guides'));
    expect(text).toMatch(/Šëàřçħ/);
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('localizes the DOGFOOD surface block inventory page from the catalog', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const selected = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: wrapPageMsg('blocks', { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' }),
      },
    }], { ctx });
    const text = frameText(must(selected.frames.at(-1)));
    expect(text).toContain(pseudoLocalize('DOGFOOD Surface Blocks'));
    expect(text).toContain(pseudoLocalize('Surface index'));
    expect(text).toContain(pseudoLocalize('DOGFOOD title and entry action surface.'));
    expect(text).not.toContain('DOGFOOD currently registers');
    expect(text).not.toContain('DOGFOOD title and entry action surface.');
  });
});

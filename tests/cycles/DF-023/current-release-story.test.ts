import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createI18nRuntime, createRuntimeLocalizationPort, type LocalizationPort,
} from '../../../packages/bijou-i18n/src/index.js';
import { BIJOU_VERSION } from '../../../examples/docs/app-ids.js';
import { BIJOU_RELEASE_LINE } from '../../../examples/docs/app-release-line.js';
import { RELEASE_STORY_GUIDES } from '../../../examples/docs/app-release-story.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { readDocumentationFile } from '../../../scripts/documentation-corpus.js';
import { renderReleaseStoryMarkdown } from '../../../examples/docs/app-release-story-render.js';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';

function localization(locale: string): LocalizationPort {
  return createRuntimeLocalizationPort(createI18nRuntime({
    locale, direction: 'ltr', fallbackLocale: 'en',
    fallbackCatalogs: dogfoodI18nCatalogsForLocale('en'),
    catalogs: ['en', 'de', 'es', 'fr'].includes(locale) ? dogfoodI18nCatalogsForLocale(locale) : [],
  }));
}

function currentStory() {
  const guide = RELEASE_STORY_GUIDES.find((entry) => entry.id === 'release-story-current');
  if (guide == null) throw new Error('Missing current release-story guide.');
  return guide;
}

describe('current release story', () => {
  it.each(['en', 'de', 'es', 'fr'])('uses the running version and line in the actual %s guide', (locale) => {
    const guide = currentStory();
    const port = localization(locale);
    const body = guide.localizedBody?.(port);
    expect(guide.localizedSummary?.(port)).toContain(`v${BIJOU_RELEASE_LINE}`);
    expect(body).toContain(BIJOU_VERSION);
    expect(body).toContain(BIJOU_RELEASE_LINE);
    expect(body).not.toMatch(/v7\.2|\{\{[A-Z_]+\}\}/u);
  });

  it('preserves English fallback for an unsupported locale', () => {
    const guide = currentStory();
    const body = guide.localizedBody?.(localization('ja'));
    expect(body).toContain('# Current Release Story');
    expect(body).toContain(BIJOU_VERSION);
    expect(guide.localizedSummary?.(undefined)).toContain(`v${BIJOU_RELEASE_LINE}`);
  });

  it.each(['9.3.0-alpha.1', '9.3.0-beta.2', '9.3.0-rc.3', '9.3.0'])(
    'keeps exact version and release line distinct for %s', (version) => {
      expect(renderReleaseStoryMarkdown('{{RELEASE_LINE}} / {{RELEASE_VERSION}}', version))
        .toBe(`9.3.0 / ${version}`);
    },
  );

  it('shows the current version through the actual reader route', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 60 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'release' });
    const result = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'release-story-current' } } },
    ], { ctx });
    const frame = result.frames.at(-1);
    if (frame == null) throw new Error('Missing reader frame.');
    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) text += frame.get(x, y).char;
      text += '\n';
    }
    expect(text).toContain(BIJOU_VERSION);
    expect(text).toContain('GraphQL proof walkthrough');
    expect(text).not.toContain('v7.2 release story');
  });

  it('keeps the original V7.2 document as historical evidence', () => {
    const archived = readDocumentationFile(
      resolve('examples/docs/content/release-story-current.md'), 'utf8',
    );
    expect(archived).toContain('v7.2 release story');
    expect(archived).toContain('broad V8 artifact work stay out of this');
  });
});

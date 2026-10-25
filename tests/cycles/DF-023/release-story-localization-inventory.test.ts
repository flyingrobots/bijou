import { describe, expect, it } from 'vitest';
import { collectDogfoodMarkdownLocalizationDebt } from '../../../examples/docs/i18n-debt-markdown-ratchet.js';
import { repoFileExists } from '../../../examples/docs/i18n-debt-io.js';
import { RELEASE_STORY_GUIDES } from '../../../examples/docs/app-release-story.js';

const SOURCE = 'examples/docs/content/release-story-active.md';

describe('current release-story localization inventory', () => {
  it('discovers the live source and preserves the English fallback body', () => {
    const inventory = collectDogfoodMarkdownLocalizationDebt();
    expect(inventory.documents.some(document => document.path === SOURCE)).toBe(true);
    expect(inventory.entries.filter(entry => entry.path === SOURCE)).toEqual([]);
    const guide = RELEASE_STORY_GUIDES.find(entry => entry.id === 'release-story-current');
    if (guide == null) throw new Error('Missing current release-story guide.');
    expect(guide.body).toBe(guide.localizedBody?.(undefined));
  });

  it.each(['de', 'es', 'fr'])('detects an unavailable live %s translation', (locale) => {
    const unavailable = `examples/docs/content/release-story-active.${locale}.md`;
    const inventory = collectDogfoodMarkdownLocalizationDebt({
      fileExists: path => path !== unavailable && repoFileExists(path),
    });
    const missing = inventory.entries.find(entry => entry.path === SOURCE && entry.locale === locale);
    expect(missing?.candidates).toContain(unavailable);
  });
});

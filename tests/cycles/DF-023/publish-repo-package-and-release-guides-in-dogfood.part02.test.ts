import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { readRepoFile } from '../repo.js';
import { must } from '@flyingrobots/bijou/adapters/test';

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-023 release-story localization', () => {
  it('renders release-story guides from localized Markdown and catalog chrome', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 60 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'release', locale: 'de' });
    const story = await runScript(app, [
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'release-story-current' } } },
    ], { ctx });
    const storyText = frameText(must(story.frames.at(-1)));
    const germanCatalog = readRepoFile('examples/docs/i18n/catalogs/de/bijou.dogfood.json');

    expect(storyText).toContain('Aktuelle Release-Geschichte');
    expect(storyText).toContain('Was ist neu');
    expect(storyText).toContain('GraphQL-Proof-Walkthrough');
    expect(storyText).not.toContain('Current Release Story');
    expect(storyText).not.toContain('Englischsprachige Quelldokumentation');
    expect(germanCatalog).toContain('"id": "release.story.current.title"');
    expect(germanCatalog).toContain('Aktuelle Release-Geschichte');
    expect(germanCatalog).toContain('Release-Verlauf aus docs/CHANGELOG.md im DOGFOOD-Reader.');
  });
});

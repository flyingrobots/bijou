import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { existsRepoPath, readRepoFile } from '../repo.js';

const BIJOU_VERSION: string = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '..', '..', '..', 'packages', 'bijou', 'package.json'), 'utf8'),
).version;

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-023 publish repo, package, and release guides in DOGFOOD', () => {
  it('captures the cycle as a real design doc', () => {
    const cycle = readRepoFile('docs/design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md');

    expect(cycle).toContain('## Sponsor human');
    expect(cycle).toContain('## Sponsor agent');
    expect(cycle).toContain('## Hill');
    expect(cycle).toContain('## Playback questions');
    expect(cycle).toContain('## Accessibility / assistive reading posture');
    expect(cycle).toContain('## Localization / directionality posture');
    expect(cycle).toContain('## Agent inspectability / explainability posture');
    expect(cycle).toContain('## Non-goals');
  });

  it('publishes repo orientation inside Guides', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const result = await runScript(app, [{
      msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'documentation-map' } },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(result.model.docsModel.activePageId).toBe('guides');
    expect(text).toContain('Documentation Map');
    expect(text).toContain('Current Truth');
    expect(text).toContain('repo documentation map');
  });

  it('publishes package explainer pages in the Packages section', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const opened = await runScript(app, [{ key: ']' }, { key: ']' }], { ctx });
    const packagesText = frameText(opened.frames.at(-1)!);

    expect(opened.model.docsModel.activePageId).toBe('packages');
    expect(packagesText).toContain('Packages Overview');
    expect(packagesText).toContain('@flyingrobots/bijou');
    expect(packagesText).toContain('@flyingrobots/bijou-tui');
    expect(packagesText).toContain('bijou-i18n-tools-node');
    expect(packagesText).toContain('left pane');
    expect(packagesText).not.toContain('left lane');

    const packageDoc = await runScript(app, [
      { key: ']' },
      { key: ']' },
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'package-bijou' } } },
    ], { ctx });
    const packageText = frameText(packageDoc.frames.at(-1)!);

    expect(packageText).toContain('The pure, zero-dependency core of Bijou.');
    expect(packageText).toContain('Surface primitives without abandoning');
  });

  it('publishes the current release story and migration guide in Release', async () => {
    const versionSlug = BIJOU_VERSION.replaceAll('.', '-');
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const opened = await runScript(app, [{ key: ']' }, { key: ']' }, { key: ']' }, { key: ']' }], { ctx });
    const releaseText = frameText(opened.frames.at(-1)!);

    expect(opened.model.docsModel.activePageId).toBe('release');
    expect(releaseText).toContain(`What's New in v${BIJOU_VERSION}`);
    expect(releaseText).toContain(`Migration Guide v${BIJOU_VERSION}`);

    const whatsNew = await runScript(app, [
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: `release-whats-new-${versionSlug}` } } },
    ], { ctx });
    expect(frameText(whatsNew.frames.at(-1)!)).toContain(`New in Bijou ${BIJOU_VERSION}`);

    const migration = await runScript(app, [
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: `release-migration-${versionSlug}` } } },
    ], { ctx });
    expect(frameText(migration.frames.at(-1)!)).toContain(`Migrating to Bijou ${BIJOU_VERSION}`);
  });

  it('moves DF-023 out of the active 4.1.0 blocker list', () => {
    expect(existsRepoPath('docs/design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/DF-023-publish-repo-package-and-release-guides-in-dogfood.md')).toBe(false);
  });
});

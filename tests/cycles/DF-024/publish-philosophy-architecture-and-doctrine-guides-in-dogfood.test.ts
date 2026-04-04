import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { existsRepoPath, readRepoFile } from '../repo.js';

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

describe('DF-024 publish philosophy, architecture, and doctrine guides in DOGFOOD', () => {
  it('captures the cycle as a real design doc', () => {
    const cycle = readRepoFile('docs/design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md');

    expect(cycle).toContain('## Sponsor human');
    expect(cycle).toContain('## Sponsor agent');
    expect(cycle).toContain('## Hill');
    expect(cycle).toContain('## Playback questions');
    expect(cycle).toContain('## Accessibility / assistive reading posture');
    expect(cycle).toContain('## Localization / directionality posture');
    expect(cycle).toContain('## Agent inspectability / explainability posture');
    expect(cycle).toContain('## Non-goals');
  });

  it('publishes doctrine and architecture pages in the Philosophy section', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const opened = await runScript(app, [{ key: ']' }, { key: ']' }, { key: ']' }], { ctx });
    const overviewText = frameText(opened.frames.at(-1)!);

    expect(opened.model.docsModel.activePageId).toBe('philosophy');
    expect(overviewText).toContain('System-Style JavaScript');
    expect(overviewText).toContain('Architecture');
    expect(overviewText).toContain('Bijou UX Doctrine');
    expect(overviewText).toContain('Invariants');
    expect(overviewText).toContain('Design System Overview');

    const systemStyle = await runScript(app, [
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'philosophy-system-style-javascript' } } },
    ], { ctx });
    const systemStyleText = frameText(systemStyle.frames.at(-1)!);
    expect(systemStyleText).toContain('Bijou Adaptation');
    expect(systemStyleText).toContain('TypeScript is a useful dialect');

    const architecture = await runScript(app, [
      { key: ']' },
      { key: ']' },
      { key: ']' },
      { msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'philosophy-architecture' } } },
    ], { ctx });
    const architectureText = frameText(architecture.frames.at(-1)!);
    expect(architectureText).toContain('Architecture');
    expect(architectureText).toContain('Bijou is a nine-package monorepo');
  });

  it('moves DF-024 out of the active 4.1.0 blocker list', () => {
    expect(existsRepoPath('docs/design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md')).toBe(false);

    const lane = readRepoFile('docs/BACKLOG/v4.1.0/README.md');
    const currentBlockers = lane.split('## Current blockers')[1]?.split('## Just closed')[0] ?? '';
    expect(currentBlockers).not.toContain('DF-024');
    expect(lane).toContain('Just closed');
    expect(lane).toContain('DF-024');
  });
});

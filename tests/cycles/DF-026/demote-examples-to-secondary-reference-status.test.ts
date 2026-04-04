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

describe('DF-026 demote examples to secondary reference status', () => {
  it('captures the cycle as a real design doc', () => {
    const cycle = readRepoFile('docs/design/DF-026-demote-examples-to-secondary-reference-status.md');

    expect(cycle).toContain('## Sponsor human');
    expect(cycle).toContain('## Sponsor agent');
    expect(cycle).toContain('## Hill');
    expect(cycle).toContain('## Playback questions');
    expect(cycle).toContain('## Accessibility / assistive reading posture');
    expect(cycle).toContain('## Localization / directionality posture');
    expect(cycle).toContain('## Agent inspectability / explainability posture');
    expect(cycle).toContain('## Non-goals');
  });

  it('publishes the examples-secondary posture inside DOGFOOD', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const result = await runScript(app, [{
      msg: { type: 'docs', msg: { type: 'select-guide', guideId: 'secondary-example-map' } },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(result.model.docsModel.activePageId).toBe('guides');
    expect(text).toContain('Secondary Example Map');
    expect(text).toContain('DOGFOOD is the primary living-docs and');
    expect(text).toContain('For the full secondary/internal inventory');
  });

  it('makes the example inventories read as secondary/internal references', () => {
    const examples = readRepoFile('examples/README.md');
    const docsExamples = readRepoFile('docs/EXAMPLES.md');

    expect(examples).toContain('secondary/internal inventory');
    expect(examples).toContain('not the primary public docs surface or learning path');
    expect(docsExamples).toContain('maintainer-facing and agent-facing reference map');
    expect(docsExamples).toContain('start with [DOGFOOD]');
  });

  it('leaves WF-003 as the only active 4.1.0 blocker', () => {
    expect(existsRepoPath('docs/design/DF-026-demote-examples-to-secondary-reference-status.md')).toBe(true);
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/DF-026-demote-examples-to-secondary-reference-status.md')).toBe(false);

    const lane = readRepoFile('docs/BACKLOG/v4.1.0/README.md');
    const currentBlockers = lane.split('## Current blockers')[1]?.split('## Just closed')[0] ?? '';
    expect(currentBlockers).not.toContain('DF-026');
    expect(currentBlockers).toContain('WF-003');
    expect(lane).toContain('Just closed');
    expect(lane).toContain('DF-026');
  });
});

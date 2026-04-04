import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';
import {
  _resetDefaultContextForTesting,
  createTestContext,
} from '../../../packages/bijou/src/adapters/test/index.js';
import {
  inspector,
  setDefaultContext,
} from '../../../packages/bijou/src/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';


describe('DL-006 inspector panel rhythm cycle', () => {
  beforeAll(() => setDefaultContext(createTestContext({ mode: 'interactive' })));
  afterAll(() => _resetDefaultContextForTesting());

  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-006-prove-inspector-panel-rhythm.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('preserves current selection and titled sections in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [
        { title: 'Profile', content: 'Rich' },
        {
          title: 'Description',
          content: 'The user can continue, but only after reading the caution.',
          tone: 'muted',
        },
      ],
      ctx,
    });

    expect(rendered).toContain('active variant');
    expect(rendered).toContain('Current selection: Warning');
    expect(rendered).toContain('Profile:');
    expect(rendered).toContain('  Rich');
    expect(rendered).toContain('Description:');
    expect(rendered).toContain('  The user can continue, but only after reading the caution.');
  });

  it('preserves inspector meaning in accessible mode without relying on visual chrome', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const rendered = inspector({
      title: 'active variant',
      currentValue: 'Warning',
      sections: [
        { title: 'Profile', content: 'Rich' },
        {
          title: 'Description',
          content: 'The user can continue, but only after reading the caution.',
          tone: 'muted',
        },
      ],
      ctx,
    });

    expect(rendered).toContain('Inspector: active variant');
    expect(rendered).toContain('Current selection: Warning');
    expect(rendered).toContain('Profile: Rich');
    expect(rendered).toContain('Description: The user can continue, but only after reading the caution.');
  });

  it('proves the inspector rhythm in the DOGFOOD variants side pane', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const result = await runScript(app, [
      { key: '\r' },
      { key: ']' },
      { key: '\r' },
      { key: '\x1b[B' },
      { key: '\r' },
    ], { ctx });
    const frame = result.frames.at(-1)!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    expect(text).toContain('active variant');
    expect(text).toContain('Current selection');
    expect(text).toContain('Success');
    expect(text).toContain('Profile');
    expect(text).toContain('Rich');
    expect(text).toContain('Description');
  });

  it('spawns the next design-language backlog item', () => {
    const cycle = readRepoFile('docs/design/DL-006-prove-inspector-panel-rhythm.md');

    expect(cycle).toContain('[DL-007 — Promote Inspector Panel Block]');
    expect(
      existsRepoPath('docs/BACKLOG/DL-007-promote-inspector-panel-block.md') ||
      existsRepoPath('docs/design/DL-007-promote-inspector-panel-block.md'),
    ).toBe(true);
  });
});

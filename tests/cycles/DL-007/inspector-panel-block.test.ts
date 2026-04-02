import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { inspectorDrawer } from '../../../packages/bijou-tui/src/index.js';
import { createCanonicalWorkbenchApp } from '../../../examples/_shared/canonical-app.js';
import { createAppFrameDemo } from '../../../examples/app-frame/main.js';
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

describe('DL-007 inspector panel block cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DL-007-promote-inspector-panel-block.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('renders inspector content inside drawer chrome through the promoted block helper', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const overlay = inspectorDrawer({
      title: 'Inspector',
      inspector: {
        title: 'Focused context',
        currentValue: 'editor:content',
        sections: [
          { title: 'Page', content: 'editor' },
          { title: 'Anchor', content: 'right', tone: 'muted' },
        ],
      },
      width: 28,
      screenWidth: 100,
      screenHeight: 20,
      ctx,
    });

    expect(overlay.content).toContain('Inspector');
    expect(overlay.content).toContain('Current selection');
    expect(overlay.content).toContain('editor:content');
    expect(overlay.content).toContain('Page');
    expect(overlay.content).toContain('Anchor');
  });

  it('proves the promoted block in the compact app-frame demo', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80, rows: 20 } });
    const app = createAppFrameDemo(ctx);
    const result = await runScript(app, [{ key: 'o' }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Inspector');
    expect(text).toContain('Current selection');
    expect(text).toContain('editor');
    expect(text).toContain('Page');
    expect(text).toContain('Palette');
  });

  it('proves the promoted block in the canonical release-workbench', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 96, rows: 24 } });
    const app = createCanonicalWorkbenchApp(ctx);
    const result = await runScript(app, [{ key: 'o' }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Panel Inspector');
    expect(text).toContain('Current selection');
    expect(text).toContain('Page');
    expect(text).toContain('Release');
    expect(text).toContain('ops:ops-summary');
  });

  it('spawns the next design-language backlog item', () => {
    expect(existsRepoPath('docs/BACKLOG/DL-008-promote-guided-flow-block.md')).toBe(true);
  });
});

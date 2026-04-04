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

describe('DF-022 build prose docs reader and top-level DOGFOOD nav cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = readRepoFile('docs/design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md');

    expect(cycle).toContain('## Sponsor human');
    expect(cycle).toContain('## Sponsor agent');
    expect(cycle).toContain('## Hill');
    expect(cycle).toContain('## Playback questions');
    expect(cycle).toContain('## Accessibility / assistive reading posture');
    expect(cycle).toContain('## Localization / directionality posture');
    expect(cycle).toContain('## Agent inspectability / explainability posture');
    expect(cycle).toContain('## Non-goals');
  });

  it('defaults the docs route to Guides and renders the new top-level docs shell', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const [model] = app.init();
    const initialFrame = app.view(model);
    const text = frameText(initialFrame as any);

    expect(model.docsModel.activePageId).toBe('guides');
    expect(text).toContain('Guides');
    expect(text).toContain('Components');
    expect(text).toContain('Packages');
    expect(text).toContain('Philosophy');
    expect(text).toContain('Release');
    expect(text).toContain('Start Here');
    expect(text).toContain('What is Bijou?');
  });

  it('keeps the component explorer alive as a separate top-level section', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });
    const result = await runScript(app, [{ key: ']' }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(result.model.docsModel.activePageId).toBe('components');
    expect(text).toContain('component families');
    expect(text).toContain('Documentation coverage');
  });

  it('leaves the remaining 4.1.0 blockers focused on corpus publication', () => {
    expect(existsRepoPath('docs/BACKLOG/v4.1.0/README.md')).toBe(true);
    const lane = readRepoFile('docs/BACKLOG/v4.1.0/README.md');

    expect(lane).toContain('Just closed');
    expect(lane).toContain('DF-023');
    expect(lane).toContain('DF-024');
    expect(lane).toContain('DF-022');
  });
});

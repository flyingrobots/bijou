import {
  afterEach,
  COMPONENT_STORIES,
  createDocsApp,
  createTestContext,
  describe,
  docsPageModel,
  expect,
  frameText,
  it,
  KEY_DOWN,
  KEY_ENTER,
  KEY_NEXT_TAB,
  resolveDogfoodDocsCoverage,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

type DocsFrame = Parameters<typeof frameText>[0];

function last(frames: readonly DocsFrame[]): DocsFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('Missing frame');
  return frame;
}

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('shows accordion-style family headers without the oversized custom help strip', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const entered = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = last(entered.frames);

    const text = frameText(frame);
    const lines = text.split('\n');
    expect(text).toContain('Status and in-flow');
    expect(lines[0]).toContain('Bijou Docs');
    const footer = lines[frame.height - 1] ?? '';
    for (const hint of ['? Help', '/ Search', 'F2 Settings', 'Tab next pane', '↑/↓ browse', 'Enter open']) {
      expect(footer).toContain(hint);
    }
    expect(lines.slice(0, frame.height - 1).join('\n')).not.toContain('↑/↓ browse • Enter open • Tab next pane');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps family scrolling anchored until the real viewport height is exhausted', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      ...Array.from({ length: 14 }, () => ({ key: KEY_DOWN })),
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');

    expect(pageModel.familyState.height).toBeGreaterThan(14);
    expect(pageModel.familyState.focusIndex).toBe(14);
    expect(pageModel.familyState.scrollY).toBe(0);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('renders the family pane through a viewport-backed scrollbar when it overflows', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 16 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = last(result.frames);
    const pageModel = docsPageModel(result.model, 'components');
    const leftPaneText = frameText(frame)
      .split('\n')
      .slice(0, -1)
      .map((line) => line.slice(0, 34))
      .join('\n');

    expect(pageModel.familyState.items.length).toBeGreaterThan(pageModel.familyState.height);
    expect(leftPaneText).toMatch(/[█│]/);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('shows a Bijou introduction and docs guide when no component is selected', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    const entered = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }], { ctx });
    const frame = last(entered.frames);
    const lines = frameText(frame).split('\n');
    const text = lines.join('\n');

    expect(text).toContain('What is Bijou?');
    expect(text).toContain('How to use these docs');
    expect(text).toContain('Documentation coverage');
    expect(text).toContain(String(coverage.documentedFamilies) + '/' + String(coverage.totalFamilies));
    expect(text).toContain(String(coverage.percent) + '%');
    expect(text).toContain('/ to search');
    expect(text).toContain('F2 for settings');
    expect(text).toContain('surface-native terminal UI framework');
  });
});

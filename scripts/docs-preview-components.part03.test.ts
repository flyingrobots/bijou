import {
  afterEach,
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
  KEY_TAB,
  runScript,
  serializeFrame,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';
import type { DocsScriptStep } from './docs-preview-model-types.js';

type DocsFrame = Parameters<typeof frameText>[0];

function last(frames: readonly DocsFrame[]): DocsFrame {
  const frame = frames.at(-1);
  if (frame == null) throw new Error('Missing frame');
  return frame;
}

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps static progress previews stable while looping previews animate on pulse', async () => {
    const openDocs = [{ key: KEY_ENTER }, { key: KEY_NEXT_TAB }] as const;
    const openProgressStory = [{ msg: { type: 'docs', msg: { type: 'select-story', storyId: 'progress-bar' } } }] as const;
    const chooseLoopingVariant = [{ msg: { type: 'docs', msg: { type: 'select-variant', index: 1 } } }] as const;
    const pulse = [{ pulse: { dt: 0.45 } }] as const;

    async function renderFrame(steps: readonly DocsScriptStep[]) {
      const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
      const app = createDocsApp(ctx);
      const result = await runScript(app, [...steps], { ctx, pulseFps: false });
      const frame = last(result.frames);
      return {
        text: frameText(frame),
        serialized: serializeFrame(frame),
      };
    }

    const staticBase = await renderFrame([...openDocs, ...openProgressStory]);
    const staticPulsed = await renderFrame([...openDocs, ...openProgressStory, ...pulse]);

    expect(staticBase.text).toContain('progressBar()');
    expect(staticBase.serialized).toEqual(staticPulsed.serialized);

    const loopingBase = await renderFrame([...openDocs, ...openProgressStory, ...chooseLoopingVariant]);
    const loopingPulsed = await renderFrame([...openDocs, ...openProgressStory, ...chooseLoopingVariant, ...pulse]);

    expect(loopingBase.text).toContain('Looping rollout');
    expect(loopingBase.serialized).not.toEqual(loopingPulsed.serialized);
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('routes arrow keys to the focused docs pane instead of always driving the family nav', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_DOWN },
      { key: KEY_TAB },
      { key: KEY_DOWN },
    ], { ctx });

    const pageModel = docsPageModel(result.model, 'components');
    expect(pageModel.familyState.items[pageModel.familyState.focusIndex]?.value).toBe('story:alert');
    expect(pageModel.variantIndexByStory.alert).toBe(1);
    expect((result.model).docsModel.focusedPaneByPage.components).toBe('story-variants');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('updates the footer hints to match the focused pane instead of leaving stale family controls visible', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 40 } });
    const app = createDocsApp(ctx);

    const result = await runScript(app, [
      { key: KEY_ENTER },
      { key: KEY_NEXT_TAB },
      { key: KEY_ENTER },
      { key: KEY_DOWN },
      { key: KEY_ENTER },
      { key: KEY_TAB },
      { key: KEY_TAB, delay: 350 },
    ], { ctx });

    const frame = last(result.frames);
    const footer = frameText(frame).split('\n')[frame.height - 1] ?? '';

    expect((result.model).docsModel.focusedPaneByPage.components).toBe('story-variants');
    expect(footer).toContain('Tab next pane');
    expect(footer).toContain('↑/↓ variant');
    expect(footer).toContain(',/. cycle');
    expect(footer).toContain('1-4 profiles');
    expect(footer).not.toContain('Enter open');
    expect(footer).not.toContain('←/→ collapse/expand');
  });
});

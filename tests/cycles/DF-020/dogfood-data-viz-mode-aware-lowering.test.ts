import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

function getStory(storyId: string) {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === storyId);
  expect(story).toBeDefined();
  return story!;
}

function renderStoryPreviewText(
  storyId: string,
  variantId: string,
  mode: OutputMode,
): string {
  const story = getStory(storyId);
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 14,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState as never,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-020 DOGFOOD data-viz lowering', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('keeps data-viz story docs honest about current lowerings', () => {
    for (const storyId of ['sparkline', 'braille-chart', 'stats-panel', 'perf-overlay'] as const) {
      const story = getStory(storyId);
      expect(story.docs.gracefulLowering.pipe).not.toContain('future direction');
      expect(story.docs.gracefulLowering.pipe).not.toContain('no mode-aware lowering yet');
      expect(story.docs.gracefulLowering.accessible).not.toContain('future direction');
      expect(story.docs.gracefulLowering.accessible).not.toContain('no mode-aware lowering yet');
    }
  });

  it('lowers sparkline and braille-chart previews into plain summaries in pipe mode', () => {
    const sparklineText = renderStoryPreviewText('sparkline', 'basic', 'pipe');
    expect(sparklineText).toContain('samples: 10');
    expect(sparklineText).toContain('range: 1 to 9');
    expect(sparklineText).toContain('latest: 3');
    expect(sparklineText).toContain('values:');
    expect(sparklineText).toContain('...');
    expect(sparklineText).not.toMatch(/[▁▂▃▄▅▆▇█]/);

    const brailleText = renderStoryPreviewText('braille-chart', 'basic', 'pipe');
    expect(brailleText).toContain('samples: 20');
    expect(brailleText).toContain('range: 1 to 9');
    expect(brailleText).toContain('peak: 9');
    expect(brailleText).toContain('latest: 4');
    expect(brailleText).not.toMatch(/[▁▂▃▄▅▆▇█]/);
    expect(brailleText).not.toMatch(/[\u2800-\u28ff]/);
  });

  it('lowers stats-panel and perf-overlay previews into explicit accessible metric summaries', () => {
    const statsText = renderStoryPreviewText('stats-panel', 'with-sparklines', 'accessible');
    expect(statsText).toContain('Perf metrics.');
    expect(statsText).toContain('FPS: 58. Trend 55-62, rising with dips.');
    expect(statsText).toContain('frame: 17.2 ms. Trend 15-18, mixed.');
    expect(statsText).toContain('heap: 42 MB. Trend 38-43, rising with dips.');
    expect(statsText).not.toMatch(/[▁▂▃▄▅▆▇█]/);

    const perfText = renderStoryPreviewText('perf-overlay', 'basic', 'accessible');
    expect(perfText).toContain('Perf metrics.');
    expect(perfText).toContain('FPS: 60.');
    expect(perfText).toContain('frame: 16.70 ms. Trend 15-18, falling with rebounds.');
    expect(perfText).toContain('size: 120×40.');
    expect(perfText).toContain('heap: 42.1 MB.');
    expect(perfText).toContain('rss: 128.0 MB.');
    expect(perfText).not.toMatch(/[\u2800-\u28ff]/);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';
const DATA_VIZ_STORIES = [
  {
    id: 'sparkline',
    title: 'sparkline()',
    variants: ['basic', 'fixed-width', 'explicit-range'],
  },
  {
    id: 'braille-chart',
    title: 'brailleChartSurface()',
    variants: ['basic', 'explicit-range'],
  },
  {
    id: 'stats-panel',
    title: 'statsPanelSurface()',
    variants: ['basic', 'with-sparklines'],
  },
  {
    id: 'perf-overlay',
    title: 'perfOverlaySurface()',
    variants: ['basic', 'no-chart'],
  },
] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BLOCK_GLYPH_RE = /[▁▂▃▄▅▆▇█]/;
const BRAILLE_GLYPH_RE = /[\u2800-\u28ff]/;
const BOX_DRAWING_RE = /[┌┐└┘─│]/;
const VISUAL_GLYPH_RE = /[▁▂▃▄▅▆▇█\u2800-\u28ff]/;
function getStory(storyId: string) {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === storyId);
  return must(story);
}
function renderStoryPreviewText(
  storyId: string,
  variantId: string,
  mode: OutputMode,
): string {
  const story = getStory(storyId);
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const profile = must(preset);
  const storyVariant = must(variant);
  const previewCtx = createStoryProfileContext(baseCtx, profile, {
    width: profile.width,
    height: 16,
  });
  const preview = storyPreviewSurface(storyVariant.render({
    width: profile.width,
    ctx: previewCtx,
    state: storyVariant.initialState,
    timeMs: 0,
  }));
  return stripAnsi(surfaceToString(preview, baseCtx.style));
}
describe('DF-066 data visualization family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-066-audit-data-visualization-family-across-real-surfaces.md');
    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });
  it('represents data visualization in the DOGFOOD story catalog', () => {
    for (const expected of DATA_VIZ_STORIES) {
      const story = getStory(expected.id);
      expect(story.coverageFamilyIds).toContain('data-visualization');
      expect(story.family).toBe('Data visualization');
      expect(story.title).toBe(expected.title);
      expect(story.variants.map((variant) => variant.id)).toEqual(expected.variants);
      expect(story.docs.gracefulLowering.pipe).not.toMatch(/future direction|no mode-aware lowering yet/i);
      expect(story.docs.gracefulLowering.accessible).not.toMatch(/future direction|no mode-aware lowering yet/i);
    }
  });
  it('renders every data visualization variant in every documented profile', () => {
    for (const story of DATA_VIZ_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
          const text = renderStoryPreviewText(story.id, variantId, mode);
          expect(text.trim().length, `${story.id}/${variantId}/${mode}`).toBeGreaterThan(0);
        }
      }
    }
  });
  it('keeps visual density in rich and static profiles only', () => {
    for (const mode of VISUAL_MODES) {
      expect(renderStoryPreviewText('sparkline', 'basic', mode), `sparkline/${mode}`).toMatch(BLOCK_GLYPH_RE);
      expect(renderStoryPreviewText('braille-chart', 'basic', mode), `braille-chart/${mode}`).toMatch(BRAILLE_GLYPH_RE);
      expect(renderStoryPreviewText('stats-panel', 'basic', mode), `stats-panel/${mode}`).toMatch(BOX_DRAWING_RE);
      expect(renderStoryPreviewText('perf-overlay', 'basic', mode), `perf-overlay/${mode}`).toMatch(BOX_DRAWING_RE);
    }
    for (const story of DATA_VIZ_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of CONSTRAINED_MODES) {
          const text = renderStoryPreviewText(story.id, variantId, mode);
          expect(text, `${story.id}/${variantId}/${mode}`).not.toMatch(VISUAL_GLYPH_RE);
        }
      }
    }
  });
  it('preserves trend summaries for chart-like lowerings', () => {
    const sparklinePipe = renderStoryPreviewText('sparkline', 'basic', 'pipe');
    const sparklineAccessible = renderStoryPreviewText('sparkline', 'basic', 'accessible');
    const braillePipe = renderStoryPreviewText('braille-chart', 'basic', 'pipe');
    const brailleAccessible = renderStoryPreviewText('braille-chart', 'basic', 'accessible');
    expect(sparklinePipe).toContain('samples: 10');
    expect(sparklinePipe).toContain('range: 1 to 9');
    expect(sparklinePipe).toContain('latest: 3');
    expect(sparklinePipe).toContain('values:');
    expect(sparklineAccessible).toContain('10 samples.');
    expect(sparklineAccessible).toContain('Started at 1 and ended at 3.');
    expect(sparklineAccessible).toContain('Range 1 to 9; latest 3.');
    expect(sparklineAccessible).toContain('Overall rising with dips trend.');
    expect(braillePipe).toContain('samples: 20');
    expect(braillePipe).toContain('range: 1 to 9');
    expect(braillePipe).toContain('peak: 9');
    expect(braillePipe).toContain('latest: 4');
    expect(brailleAccessible).toContain('20 samples.');
    expect(brailleAccessible).toContain('Started at 1 and ended at 4.');
    expect(brailleAccessible).toContain('Range 1 to 9; peak 9.');
    expect(brailleAccessible).toContain('Overall rising with dips area trend.');
  });
  it('preserves metric and performance facts in constrained lowerings', () => {
    const statsPipe = renderStoryPreviewText('stats-panel', 'with-sparklines', 'pipe');
    const statsAccessible = renderStoryPreviewText('stats-panel', 'with-sparklines', 'accessible');
    const perfPipe = renderStoryPreviewText('perf-overlay', 'basic', 'pipe');
    const perfAccessible = renderStoryPreviewText('perf-overlay', 'basic', 'accessible');
    expect(statsPipe).toContain('Perf');
    expect(statsPipe).toContain('FPS: 58');
    expect(statsPipe).toContain('frame: 17.2 ms');
    expect(statsPipe).toContain('heap: 42 MB');
    expect(statsAccessible).toContain('Perf metrics.');
    expect(statsAccessible).toContain('FPS: 58. Trend 55-62, rising with dips.');
    expect(statsAccessible).toContain('frame: 17.2 ms. Trend 15-18, mixed.');
    expect(perfPipe).toContain('Perf');
    expect(perfPipe).toContain('FPS: 60');
    expect(perfPipe).toContain('frame: 16.70 ms');
    expect(perfPipe).toContain('heap: 42.1 MB');
    expect(perfAccessible).toContain('Perf metrics.');
    expect(perfAccessible).toContain('FPS: 60.');
    expect(perfAccessible).toContain('frame: 16.70 ms. Trend 15-18, falling with rebounds.');
    expect(perfAccessible).toContain('heap: 42.1 MB.');
  });
  it('keeps component-family guidance aligned with data visualization runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');
    expect(families).toContain('### Data visualization');
    expect(families).toContain('- `sparkline()`');
    expect(families).toContain('- `brailleChartSurface()`');
    expect(families).toContain('- `statsPanelSurface()`');
    expect(families).toContain('- `perfOverlaySurface()`');
    expect(families).toContain('numeric trends at a glance');
    expect(families).toContain('time-series or rolling metric');
    expect(families).toContain('ready-made FPS + memory overlay');
    expect(families).toContain('always supply `min`/`max`');
    expect(families).toContain('pipe: numeric summary');
    expect(families).toContain('accessible: spoken trend summary');
  });
});

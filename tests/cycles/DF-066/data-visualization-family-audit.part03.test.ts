import { afterEach, describe, expect, it } from 'vitest';

import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';

import { must, _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';

import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';

import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

import { readRepoFile } from '../repo.js';

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
});

describe('DF-066 data visualization family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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

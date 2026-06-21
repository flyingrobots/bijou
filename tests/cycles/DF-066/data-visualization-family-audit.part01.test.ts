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
});

describe('DF-066 data visualization family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});

describe('DF-066 data visualization family audit', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

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
});

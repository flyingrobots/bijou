import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const MOTION_STORY_ID = 'motion-and-shader-effects';
const EXPECTED_VARIANT_IDS = [
  'shader-wave',
  'braille-field',
  'glyph-raytrace',
  'spring-timeline',
] as const;

function getMotionStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === MOTION_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderMotionVariantText(variantId: string, mode: OutputMode): string {
  const story = getMotionStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 16,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState,
    timeMs: 1_200,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-053 motion and shader DOGFOOD audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the Design Thinking playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-053-audit-motion-and-shader-effects-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents the full motion and shader family in the DOGFOOD story', () => {
    const story = getMotionStory();

    expect(story.coverageFamilyIds).toContain(MOTION_STORY_ID);
    expect(story.title).toContain('canvas()');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'animate()',
      'timeline()',
      'transition shaders',
      'raytrace helpers',
    ]));
    expect(story.source?.examplePath).toBe('examples/transitions/main.ts');
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every motion and shader variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderMotionVariantText(variantId, mode);
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps constrained motion and shader lowerings textual', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['pipe', 'accessible'] as const) {
        const text = renderMotionVariantText(variantId, mode);

        expect(text).not.toMatch(/[\u2800-\u28ff]/);
        expect(text).not.toMatch(/[█▀▄▌▐░▒▓]/);
        expect(text).toMatch(/motion|shader|raytrace|timeline|spring|transition/i);
      }
    }
  });

  it('keeps current transition and spring examples aligned with the public API', () => {
    const transitionExample = readRepoFile('examples/transitions/main.ts');
    const springExample = readRepoFile('examples/spring/main.ts');

    expect(transitionExample).toContain('createFramedApp');
    expect(transitionExample).toContain('transitionOverride');
    expect(springExample).toContain('animate({');
    expect(springExample).not.toContain('fps:');
  });
});

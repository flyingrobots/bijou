import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { must, _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';
const OVERLAY_STORIES = [
  {
    id: 'modal',
    title: 'modal()',
    variants: ['confirm', 'help'],
  },
  {
    id: 'drawer',
    title: 'drawer()',
    variants: ['supplemental-right', 'bottom-review'],
  },
  {
    id: 'tooltip',
    title: 'tooltip()',
    variants: ['local-explanation', 'clamped-edge'],
  },
  {
    id: 'toast',
    title: 'toast()',
    variants: ['saved-top-right', 'error-bottom-left'],
  },
] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;
function getStory(storyId: string) {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === storyId);
  return must(story);
}
function renderOverlayVariantText(
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
    height: 18,
  });
  const preview = storyPreviewSurface(storyVariant.render({
    width: profile.width,
    ctx: previewCtx,
    state: storyVariant.initialState,
    timeMs: 0,
  }));
  return stripAnsi(surfaceToString(preview, baseCtx.style));
}
describe('DF-061 overlay primitives family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-061-audit-overlay-primitives-family-across-real-surfaces.md');
    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });
  it('represents every overlay primitive in the DOGFOOD story catalog', () => {
    for (const expected of OVERLAY_STORIES) {
      const story = getStory(expected.id);
      expect(story.coverageFamilyIds).toContain('overlay-primitives');
      expect(story.title).toBe(expected.title);
      expect(story.package).toBe('bijou-tui');
      expect(story.variants.map((variant) => variant.id)).toEqual(expected.variants);
      expect(story.docs.gracefulLowering.pipe).not.toMatch(/future direction|no mode-aware lowering yet/i);
      expect(story.docs.gracefulLowering.accessible).not.toMatch(/future direction|no mode-aware lowering yet/i);
    }
  });
  it('renders every overlay primitive variant in every documented profile', () => {
    for (const story of OVERLAY_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
          const text = renderOverlayVariantText(story.id, variantId, mode);
          expect(text.trim().length, `${story.id}/${variantId}/${mode}`).toBeGreaterThan(0);
        }
      }
    }
  });
  it('keeps visual overlay chrome out of constrained lowerings', () => {
    for (const story of OVERLAY_STORIES) {
      for (const variantId of story.variants) {
        for (const mode of VISUAL_MODES) {
          const text = renderOverlayVariantText(story.id, variantId, mode);
          expect(text, `${story.id}/${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
        }
        for (const mode of CONSTRAINED_MODES) {
          const text = renderOverlayVariantText(story.id, variantId, mode);
          expect(text, `${story.id}/${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
        }
      }
    }
  });
  it('preserves blocking modal prompts in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('modal', 'confirm', 'pipe');
    const accessible = renderOverlayVariantText('modal', 'help', 'accessible');
    expect(pipe).toContain('modal: Confirm deploy');
    expect(pipe).toContain('Deploy release-control to production?');
    expect(pipe).toContain('Actions: y yes, n no, esc cancel');
    expect(accessible).toContain('modal: Keyboard help');
    expect(accessible).toContain('Move between stories');
    expect(accessible).toContain('return to the page');
  });
  it('preserves supplemental drawer context in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('drawer', 'supplemental-right', 'pipe');
    const accessible = renderOverlayVariantText('drawer', 'bottom-review', 'accessible');
    expect(pipe).toContain('drawer: Release context');
    expect(pipe).toContain('Supplemental context');
    expect(pipe).toContain('Canaries stable');
    expect(accessible).toContain('drawer: Review queue');
    expect(accessible).toContain('Supplemental review panel');
    expect(accessible).toContain('migrations waiting');
  });
  it('preserves local tooltip explanation in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('tooltip', 'local-explanation', 'pipe');
    const accessible = renderOverlayVariantText('tooltip', 'clamped-edge', 'accessible');
    expect(pipe).toContain('tooltip: Command palette');
    expect(pipe).toContain('Search actions and docs');
    expect(accessible).toContain('tooltip: Edge action');
    expect(accessible).toContain('Runs verification');
  });
  it('preserves transient toast events in constrained lowerings', () => {
    const pipe = renderOverlayVariantText('toast', 'saved-top-right', 'pipe');
    const accessible = renderOverlayVariantText('toast', 'error-bottom-left', 'accessible');
    expect(pipe).toContain('toast: success');
    expect(pipe).toContain('Operation saved.');
    expect(accessible).toContain('toast: error');
    expect(accessible).toContain('Rollback required before promote.');
  });
  it('keeps component-family guidance aligned with overlay primitive truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');
    expect(families).toContain('### Overlay primitives');
    expect(families).toContain('- `tooltip()`');
    expect(families).toContain('- `drawer()`');
    expect(families).toContain('- `modal()`');
    expect(families).toContain('- `toast()`');
    expect(families).toContain('explanatory');
    expect(families).toContain('supplemental');
    expect(families).toContain('blocking');
    expect(families).toContain('transient');
    expect(families).toContain('prefer `drawer()` over `modal()`');
    expect(families).toContain('stop composing ad hoc `toast()` overlays and move up to the notification system');
    expect(families).toContain('pipe: lower to plain text event or prompt surfaces');
    expect(families).toContain('accessible: linearize overlay content');
  });
});

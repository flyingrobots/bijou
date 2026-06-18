import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const HELP_STORY_ID = 'help-view';
const EXPECTED_VARIANT_IDS = ['shell-hint', 'grouped-reference'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getHelpStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === HELP_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderHelpVariantText(variantId: string, mode: OutputMode): string {
  const story = getHelpStory();
  const variant = story.variants.find((candidate) => candidate.id === variantId);
  expect(variant).toBeDefined();

  const preset = story.profilePresets.find((candidate) => candidate.mode === mode);
  expect(preset).toBeDefined();

  const baseCtx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
  const previewCtx = createStoryProfileContext(baseCtx, preset!, {
    width: preset!.width,
    height: 18,
  });
  const preview = storyPreviewSurface(variant!.render({
    width: preset!.width,
    ctx: previewCtx,
    state: variant!.initialState,
    timeMs: 0,
  }));

  return stripAnsi(surfaceToString(preview, baseCtx.style));
}

describe('DF-064 keybinding help and shell hints family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-064-audit-keybinding-help-and-shell-hints-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents keybinding help and shell hints in the DOGFOOD story catalog', () => {
    const story = getHelpStory();

    expect(story.coverageFamilyIds).toContain('keybinding-help-and-shell-hints');
    expect(story.title).toBe('helpView() / helpShortSurface()');
    expect(story.package).toBe('bijou-tui');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'kbd()',
      'commandPalette()',
      'createFramedApp()',
    ]));
    expect(story.docs.summary).toMatch(/keyboard|shortcut|shell hint/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every help variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderHelpVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps visual containment out of constrained lowerings', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderHelpVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderHelpVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves compact shell hint semantics in constrained lowerings', () => {
    const pipe = renderHelpVariantText('shell-hint', 'pipe');
    const accessible = renderHelpVariantText('shell-hint', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('shell hint');
      expect(text).toContain('Move down');
      expect(text).toContain('Move up');
      expect(text).toContain('Next pane');
      expect(text).toContain('Open selection');
      expect(text).toContain('Search documentation');
      expect(text).toContain('Open settings');
      expect(text).toContain('Open help');
      expect(text).toContain('Quit');
    }
  });

  it('preserves grouped reference semantics in constrained lowerings', () => {
    const pipe = renderHelpVariantText('grouped-reference', 'pipe');
    const accessible = renderHelpVariantText('grouped-reference', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('grouped help');
      expect(text).toContain('Keyboard shortcuts');
      expect(text).toContain('Navigation');
      expect(text).toContain('Actions');
      expect(text).toContain('Shell');
      expect(text).toContain('j');
      expect(text).toContain('Move down');
      expect(text).toContain('Enter');
      expect(text).toContain('Open selection');
      expect(text).toContain('?');
      expect(text).toContain('Open help');
    }
  });

  it('keeps component-family guidance aligned with help runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### Keybinding help and shell hints');
    expect(families).toContain('- `createKeyMap()`');
    expect(families).toContain('- `helpView()`');
    expect(families).toContain('- `helpViewSurface()`');
    expect(families).toContain('- `helpShort()`');
    expect(families).toContain('- `helpShortSurface()`');
    expect(families).toContain('- `helpFor()`');
    expect(families).toContain('- `helpForSurface()`');
    expect(families).toContain('grouped reference, single-line hint');
    expect(families).toContain('keyboard-owned');
    expect(families).toContain('group names should describe jobs');
    expect(families).toContain('pipe: lower to plain text shortcut summaries');
    expect(families).toContain('accessible: linearize help content');
  });
});

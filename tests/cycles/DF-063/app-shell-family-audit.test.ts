import { afterEach, describe, expect, it } from 'vitest';
import { stripAnsi, surfaceToString, type OutputMode } from '@flyingrobots/bijou';
import { _resetDefaultContextForTesting, createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  createStoryProfileContext,
  storyPreviewSurface,
} from '../../../examples/_stories/protocol.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { readRepoFile } from '../repo.js';

const APP_SHELL_STORY_ID = 'app-shell';
const EXPECTED_VARIANT_IDS = ['framed-page', 'command-discovery'] as const;
const VISUAL_MODES: readonly OutputMode[] = ['interactive', 'static'];
const CONSTRAINED_MODES: readonly OutputMode[] = ['pipe', 'accessible'];
const BOX_DRAWING_RE = /[┌┐└┘─│]/;

function getAppShellStory() {
  const story = COMPONENT_STORIES.find((candidate) => candidate.id === APP_SHELL_STORY_ID);
  expect(story).toBeDefined();
  return story!;
}

function renderAppShellVariantText(variantId: string, mode: OutputMode): string {
  const story = getAppShellStory();
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

describe('DF-063 app shell family audit', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DF-063-audit-app-shell-family-across-real-surfaces.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('represents app shell in the DOGFOOD story catalog', () => {
    const story = getAppShellStory();

    expect(story.coverageFamilyIds).toContain('app-shell');
    expect(story.title).toBe('createFramedApp() / statusBarSurface() / commandPaletteSurface()');
    expect(story.package).toBe('bijou-tui');
    expect(story.docs.relatedFamilies).toEqual(expect.arrayContaining([
      'statusBarSurface()',
      'helpViewSurface()',
      'commandPaletteSurface()',
      'tabs()',
    ]));
    expect(story.docs.summary).toMatch(/multi-view|status|command/i);
    expect(story.variants.map((variant) => variant.id)).toEqual(EXPECTED_VARIANT_IDS);
  });

  it('renders every app shell variant in every documented profile', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of ['interactive', 'static', 'pipe', 'accessible'] as const) {
        const text = renderAppShellVariantText(variantId, mode);
        expect(text.trim().length, `${variantId}/${mode}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps visual shell chrome out of constrained lowerings', () => {
    for (const variantId of EXPECTED_VARIANT_IDS) {
      for (const mode of VISUAL_MODES) {
        const text = renderAppShellVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).toMatch(BOX_DRAWING_RE);
      }

      for (const mode of CONSTRAINED_MODES) {
        const text = renderAppShellVariantText(variantId, mode);
        expect(text, `${variantId}/${mode}`).not.toMatch(BOX_DRAWING_RE);
      }
    }
  });

  it('preserves framed page shell context in constrained lowerings', () => {
    const pipe = renderAppShellVariantText('framed-page', 'pipe');
    const accessible = renderAppShellVariantText('framed-page', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('framed shell');
      expect(text).toContain('DOGFOOD shell');
      expect(text).toContain('Page: Docs');
      expect(text).toContain('Status: NORMAL');
      expect(text).toContain('ctrl+p palette');
    }
  });

  it('preserves command discovery intent in constrained lowerings', () => {
    const pipe = renderAppShellVariantText('command-discovery', 'pipe');
    const accessible = renderAppShellVariantText('command-discovery', 'accessible');

    for (const text of [pipe, accessible]) {
      expect(text).toContain('command palette');
      expect(text).toContain('DOGFOOD shell');
      expect(text).toContain('Page: Docs');
      expect(text).toMatch(/Command palette: search.*docs/);
    }
  });

  it('keeps component-family guidance aligned with app shell runtime truth', () => {
    const families = readRepoFile('docs/design-system/component-families.md');

    expect(families).toContain('### App shell');
    expect(families).toContain('- `createFramedApp()`');
    expect(families).toContain('- `statusBar()`');
    expect(families).toContain('- `statusBarSurface()`');
    expect(families).toContain('- `commandPalette()`');
    expect(families).toContain('- `commandPaletteSurface()`');
    expect(families).toContain('shell container, status rail, action discovery');
    expect(families).toContain('multiple views, overlays, navigation, and shell chrome');
    expect(families).toContain('status lines should carry concise global context');
    expect(families).toContain('command palette entries should prefer actions');
    expect(families).toContain('pipe: lower to current page content plus minimal status/context framing');
    expect(families).toContain('accessible: linearize active shell state');
  });
});

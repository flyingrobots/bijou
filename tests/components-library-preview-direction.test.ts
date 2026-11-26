import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { mirrorsLayout, type BijouContext, type InlineDirection, type OutputMode, type Surface } from '../packages/bijou/src/index.js';
import { surfaceToString } from '../packages/bijou/src/core/render/differ.js';
import { CANONICAL_STORY_PROFILE_PRESETS, createStoryProfileContext, type ComponentStory } from '../examples/_stories/protocol.js';
import { createLibraryApp, LIBRARY_CSS } from '../examples/components/library.js';
import { initialModel } from '../examples/components/library-model.js';
import { renderPreview } from '../examples/components/library-view.js';
import { createClipContext, recordClip } from '../examples/hero/clip.js';

// The Components Library's direction toggle reaches every story preview through the
// preview context (flyingrobots/bijou#840). No component on main reads ctx.direction yet,
// so this test-only component reads it through the same helper the real ones use.
function pair(options: { readonly ctx: BijouContext; readonly direction?: InlineDirection }): string {
  const items = ['start', 'end'];
  return (mirrorsLayout(options) ? [...items].reverse() : items).join(' | ');
}

function story(direction?: InlineDirection): ComponentStory {
  const lowering = { interactive: 'pair', static: 'pair', pipe: 'pair', accessible: 'pair' };
  return {
    kind: 'component', id: 'pair', family: 'Test', title: 'pair()', package: 'bijou',
    docs: { summary: 'pair', useWhen: [], avoidWhen: [], relatedFamilies: [], gracefulLowering: lowering },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [{ id: 'default', label: 'Default', description: 'pair', render: ({ ctx }) => pair({ ctx, ...(direction === undefined ? {} : { direction }) }) }],
    source: { examplePath: 'tests/components-library-preview-direction.test.ts', snippetLabel: 'pair' },
  };
}

const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80, rows: 24 } });

function firstRow(surface: Surface): string {
  return Array.from({ length: surface.width }, (_, x) => surface.get(x, 0).char).join('').trimEnd();
}

function preview(mode: OutputMode, rtl: boolean, subject = story()): string {
  return firstRow(renderPreview(subject, 0, initialModel({ component: 'alert', mode, rtl }), ctx, 40, 10));
}

describe('the Components Library carries its direction toggle into story previews', () => {
  it('defaults the preview context to ltr', () => {
    expect(preview('interactive', false)).toBe('start | end');
    expect(preview('static', false)).toBe('start | end');
  });

  it('mirrors a direction-aware component at rtl in interactive and static modes', () => {
    expect(preview('interactive', true)).toBe('end | start');
    expect(preview('static', true)).toBe('end | start');
  });

  it('leaves pipe and accessible output in logical order at rtl', () => {
    expect(preview('pipe', true)).toBe('start | end');
    expect(preview('accessible', true)).toBe('start | end');
  });

  it('keeps a direction the story sets for itself', () => {
    expect(preview('interactive', true, story('ltr'))).toBe('start | end');
    expect(preview('interactive', false, story('rtl'))).toBe('end | start');
  });

  it('returns identical preview frames when toggled back and forth', () => {
    const ltr = preview('interactive', false);
    const rtl = preview('interactive', true);
    expect([preview('interactive', false), preview('interactive', true), preview('interactive', false)]).toEqual([ltr, rtl, ltr]);
  });

  it('sets the preview context direction from the profile context options', () => {
    const preset = CANONICAL_STORY_PROFILE_PRESETS[0];
    if (preset === undefined) throw new Error('missing preset');
    expect(createStoryProfileContext(ctx, preset, { direction: 'rtl' }).direction).toBe('rtl');
    expect(createStoryProfileContext(ctx, preset).direction).toBe(ctx.direction);
  });
});

describe('toggling r twice in the running library', () => {
  it('paints the same final frame as never toggling', async () => {
    async function lastFrame(keys: readonly (readonly [number, string])[]): Promise<string> {
      const clip = createClipContext(120, 36);
      const frames = await recordClip(createLibraryApp(clip.ctx, { component: 'alert' }), clip, { seconds: 1.2, fps: 5, css: LIBRARY_CSS, keys });
      const last = frames[frames.length - 1];
      if (last === undefined) throw new Error('no frames recorded');
      return surfaceToString(last, clip.ctx.style);
    }
    expect(await lastFrame([[0.2, 'r'], [0.6, 'r']])).toBe(await lastFrame([]));
  });
});

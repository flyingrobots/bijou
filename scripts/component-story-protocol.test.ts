import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  CANONICAL_STORY_PROFILE_PRESETS,
  createStoryProfileContext,
  findStoryProfileIndex,
  resolveStoryProfilePreset,
  resolveStoryVariant,
  storyDocsMarkdown,
  storyPreviewSurface,
  type ComponentStory,
} from '../examples/_stories/protocol.js';

const SAMPLE_STORY: ComponentStory = {
  kind: 'component',
  id: 'sample',
  family: 'Status and feedback',
  title: 'sample()',
  package: 'bijou',
  docs: {
    summary: 'Structured docs generated from fields.',
    useWhen: ['A page needs durable status.', 'Lowering behavior matters.'],
    avoidWhen: ['The message is purely decorative.'],
    relatedFamilies: ['note()', 'toast()'],
    gracefulLowering: {
      interactive: 'Bordered box with styling.',
      static: 'Single-frame bordered box.',
      pipe: 'Bracketed text.',
      accessible: 'Spoken prefix.',
    },
  },
  profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
  variants: [
    {
      id: 'default',
      label: 'Default',
      description: 'Baseline story variant.',
      render: () => 'preview body',
    },
  ],
  source: {
    examplePath: 'examples/sample/main.ts',
    snippetLabel: 'Sample snippet',
  },
};

describe('ComponentStory protocol', () => {
  it('creates profile contexts without mutating the base runtime viewport', () => {
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 80, rows: 24 },
    });

    const profiled = createStoryProfileContext(ctx, CANONICAL_STORY_PROFILE_PRESETS[2]!, {
      width: 44,
      height: 13,
    });

    expect(profiled.mode).toBe('pipe');
    expect(profiled.runtime.columns).toBe(44);
    expect(profiled.runtime.rows).toBe(13);
    expect(ctx.mode).toBe('interactive');
    expect(ctx.runtime.columns).toBe(80);
    expect(ctx.runtime.rows).toBe(24);
  });

  it('derives docs markdown from structured story fields', () => {
    const variant = resolveStoryVariant(SAMPLE_STORY, 0);
    const preset = resolveStoryProfilePreset(SAMPLE_STORY, 1);
    const markdown = storyDocsMarkdown(SAMPLE_STORY, variant, preset);

    expect(markdown).toContain('# sample()');
    expect(markdown).toContain('## Use when');
    expect(markdown).toContain('- A page needs durable status.');
    expect(markdown).toContain('## Graceful lowering');
    expect(markdown).toContain('**Profile:** Static (`static`, 60 cols)');
    expect(markdown).toContain('Example: `examples/sample/main.ts`');
  });

  it('finds matching profile modes and lowers string previews to surfaces', () => {
    expect(findStoryProfileIndex(SAMPLE_STORY, 'accessible')).toBe(3);
    expect(storyPreviewSurface('preview body').width).toBe('preview body'.length);
  });
});

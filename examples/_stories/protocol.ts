import {
  installRuntimeViewportOverlay,
  updateRuntimeViewport,
} from '@flyingrobots/bijou';
import type { BijouContext, InlineDirection, Surface } from '@flyingrobots/bijou';
import { contentSurface } from '../_shared/example-surfaces.js';
import type {
  StoryMode,
  StoryPreview,
  StoryVariant,
  StoryProfilePreset,
  ComponentStory,
} from './protocol-types.js';

export const CANONICAL_STORY_PROFILE_PRESETS: readonly StoryProfilePreset[] = [
  { id: 'interactive', label: 'Rich', mode: 'interactive', width: 60 },
  { id: 'static', label: 'Static', mode: 'static', width: 60 },
  { id: 'pipe', label: 'Pipe', mode: 'pipe', width: 52 },
  { id: 'accessible', label: 'Accessible', mode: 'accessible', width: 52 },
] as const;

export function resolveStoryVariant<State>(
  story: ComponentStory<State>,
  index = 0,
): StoryVariant<State> {
  if (story.variants.length === 0) {
    throw new Error(
      `ComponentStory "${story.id}" must define at least one variant`,
    );
  }
  const variant = story.variants[clampIndex(index, story.variants.length)];
  if (variant === undefined) {
    throw new Error(
      `ComponentStory "${story.id}" variant index could not be resolved`,
    );
  }
  return variant;
}

export function resolveStoryProfilePreset(
  story: Pick<ComponentStory, 'id' | 'profilePresets'>,
  index = 0,
): StoryProfilePreset {
  if (story.profilePresets.length === 0) {
    throw new Error(
      `ComponentStory "${story.id}" must define at least one profile preset`,
    );
  }
  const preset =
    story.profilePresets[clampIndex(index, story.profilePresets.length)];
  if (preset === undefined) {
    throw new Error(
      `ComponentStory "${story.id}" profile preset index could not be resolved`,
    );
  }
  return preset;
}

export function findStoryProfileIndex(
  story: Pick<ComponentStory, 'profilePresets'>,
  mode: StoryMode,
): number {
  const match = story.profilePresets.findIndex(
    (preset) => preset.mode === mode,
  );
  return match >= 0 ? match : 0;
}

/**
 * Build the context one story preview renders with: the preset's output mode, its own viewport and,
 * when given, the host's layout direction. Without `direction` the base context's direction is kept.
 */
export function createStoryProfileContext(
  baseCtx: BijouContext,
  preset: StoryProfilePreset,
  options?: { readonly width?: number; readonly height?: number; readonly direction?: InlineDirection },
): BijouContext {
  const host = { runtime: baseCtx.runtime };
  const runtime = installRuntimeViewportOverlay(host);
  updateRuntimeViewport(
    runtime,
    Math.max(1, options?.width ?? preset.width),
    Math.max(1, options?.height ?? baseCtx.runtime.rows),
  );

  return {
    ...baseCtx,
    mode: preset.mode,
    runtime,
    ...(options?.direction === undefined ? {} : { direction: options.direction }),
  };
}

export function storyPreviewSurface(preview: StoryPreview): Surface {
  return typeof preview === 'string' ? contentSurface(preview) : preview;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, Math.floor(index)));
}

export { storyDocsMarkdown } from './protocol-markdown.js';
export type {
  StoryPackage,
  StoryMode,
  StoryPreview,
  StoryLowering,
  StoryDocs,
  StoryVariant,
  StoryProfilePreset,
  StorySource,
  ComponentStory,
} from './protocol-types.js';

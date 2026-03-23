import {
  installRuntimeViewportOverlay,
  updateRuntimeViewport,
  type BijouContext,
  type OutputMode,
  type Surface,
} from '@flyingrobots/bijou';
import { contentSurface } from '../_shared/example-surfaces.js';

export type StoryPackage = 'bijou' | 'bijou-tui' | 'bijou-tui-app';
export type StoryMode = OutputMode;
export type StoryPreview = string | Surface;

export interface StoryLowering {
  readonly interactive: string;
  readonly static: string;
  readonly pipe: string;
  readonly accessible: string;
}

export interface StoryDocs {
  readonly summary: string;
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly relatedFamilies: readonly string[];
  readonly gracefulLowering: StoryLowering;
}

export interface StoryVariant<State = void> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly initialState?: State;
  readonly render: (input: {
    readonly width: number;
    readonly ctx: BijouContext;
    readonly state: State;
  }) => StoryPreview;
}

export interface StoryProfilePreset {
  readonly id: string;
  readonly label: string;
  readonly mode: StoryMode;
  readonly width: number;
}

export interface StorySource {
  readonly examplePath?: string;
  readonly snippetLabel?: string;
}

export interface ComponentStory<State = void> {
  readonly kind: 'component';
  readonly id: string;
  readonly family: string;
  readonly title: string;
  readonly package: StoryPackage;
  readonly docs: StoryDocs;
  readonly profilePresets: readonly StoryProfilePreset[];
  readonly variants: readonly StoryVariant<State>[];
  readonly source?: StorySource;
  readonly tags?: readonly string[];
}

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
    throw new Error(`ComponentStory "${story.id}" must define at least one variant`);
  }
  return story.variants[clampIndex(index, story.variants.length)]!;
}

export function resolveStoryProfilePreset(
  story: Pick<ComponentStory, 'id' | 'profilePresets'>,
  index = 0,
): StoryProfilePreset {
  if (story.profilePresets.length === 0) {
    throw new Error(`ComponentStory "${story.id}" must define at least one profile preset`);
  }
  return story.profilePresets[clampIndex(index, story.profilePresets.length)]!;
}

export function findStoryProfileIndex(
  story: Pick<ComponentStory, 'profilePresets'>,
  mode: StoryMode,
): number {
  const match = story.profilePresets.findIndex((preset) => preset.mode === mode);
  return match >= 0 ? match : 0;
}

export function createStoryProfileContext(
  baseCtx: BijouContext,
  preset: StoryProfilePreset,
  viewport?: { readonly width?: number; readonly height?: number },
): BijouContext {
  const host = { runtime: baseCtx.runtime };
  const runtime = installRuntimeViewportOverlay(host);
  updateRuntimeViewport(
    runtime,
    Math.max(1, viewport?.width ?? preset.width),
    Math.max(1, viewport?.height ?? baseCtx.runtime.rows),
  );

  return {
    ...baseCtx,
    mode: preset.mode,
    runtime,
  };
}

export function storyDocsMarkdown<State>(
  story: ComponentStory<State>,
  variant: StoryVariant<State>,
  preset: StoryProfilePreset,
): string {
  const lines: string[] = [
    `# ${story.title}`,
    '',
    story.docs.summary,
    '',
    '- **Family:** ' + story.family,
    '- **Package:** ' + `\`${story.package}\``,
    '- **Variant:** ' + variant.label,
    '- **Profile:** ' + `${preset.label} (\`${preset.mode}\`, ${preset.width} cols)`,
  ];

  if (variant.description != null) {
    lines.push(`- **Variant focus:** ${variant.description}`);
  }

  lines.push(
    '',
    '## Use when',
    '',
    ...toMarkdownList(story.docs.useWhen),
    '',
    '## Avoid when',
    '',
    ...toMarkdownList(story.docs.avoidWhen),
    '',
    '## Graceful lowering',
    '',
    `- **Interactive:** ${story.docs.gracefulLowering.interactive}`,
    `- **Static:** ${story.docs.gracefulLowering.static}`,
    `- **Pipe:** ${story.docs.gracefulLowering.pipe}`,
    `- **Accessible:** ${story.docs.gracefulLowering.accessible}`,
    '',
    '## Related families',
    '',
    ...toMarkdownList(story.docs.relatedFamilies.map((family) => `\`${family}\``)),
  );

  if (story.source?.examplePath != null || story.source?.snippetLabel != null) {
    lines.push('', '## Source', '');
    if (story.source.examplePath != null) {
      lines.push(`- Example: \`${story.source.examplePath}\``);
    }
    if (story.source.snippetLabel != null) {
      lines.push(`- Snippet label: ${story.source.snippetLabel}`);
    }
  }

  return lines.join('\n');
}

export function storyPreviewSurface(preview: StoryPreview): Surface {
  return typeof preview === 'string' ? contentSurface(preview) : preview;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, Math.floor(index)));
}

function toMarkdownList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}

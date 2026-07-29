import type { BijouContext, OutputMode, Surface } from '@flyingrobots/bijou';

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
    readonly timeMs: number;
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

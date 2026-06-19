import type { ComponentMetadata } from './component-metadata.js';
import type { OutputMode } from './detect/tty.js';

export interface StoryCaptureProfile {
  readonly id: string;
  readonly label: string;
  readonly mode: OutputMode;
  readonly width: number;
}

export interface StoryCaptureVariant {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface StoryCaptureRenderInput {
  readonly storyId: string;
  readonly metadata?: ComponentMetadata;
  readonly profile: StoryCaptureProfile;
  readonly variant: StoryCaptureVariant;
}

export interface StoryCapture {
  readonly storyId: string;
  readonly profileId: string;
  readonly variantId: string;
  readonly mode: OutputMode;
  readonly width: number;
  readonly output: string;
}

export interface StoryCaptureMatrixOptions {
  readonly storyId: string;
  readonly title?: string;
  readonly metadata?: ComponentMetadata;
  readonly profiles: readonly StoryCaptureProfile[];
  readonly variants: readonly StoryCaptureVariant[];
  readonly requiredModes?: readonly OutputMode[];
  readonly render: (input: StoryCaptureRenderInput) => string;
}

export interface StoryCaptureMatrix {
  readonly storyId: string;
  readonly title?: string;
  readonly metadata?: ComponentMetadata;
  readonly profiles: readonly StoryCaptureProfile[];
  readonly variants: readonly StoryCaptureVariant[];
  readonly captures: readonly StoryCapture[];
  readonly missingModes: readonly OutputMode[];
}

const MODE_ORDER: readonly OutputMode[] = ['interactive', 'static', 'pipe', 'accessible'];
const LIST_SEPARATOR = ',';
const EMPTY_LABEL = '-';

export function captureStoryMatrix(options: StoryCaptureMatrixOptions): StoryCaptureMatrix {
  const captures: StoryCapture[] = [];
  for (const profile of options.profiles) {
    for (const variant of options.variants) {
      captures.push({
        storyId: options.storyId,
        profileId: profile.id,
        variantId: variant.id,
        mode: profile.mode,
        width: profile.width,
        output: options.render({
          storyId: options.storyId,
          metadata: options.metadata,
          profile,
          variant,
        }),
      });
    }
  }

  return {
    storyId: options.storyId,
    title: options.title,
    metadata: options.metadata,
    profiles: options.profiles,
    variants: options.variants,
    captures,
    missingModes: missingRequiredModes(options.requiredModes ?? [], options.profiles),
  };
}

export function storyCaptureMatrixText(matrix: StoryCaptureMatrix): string {
  const lines = [
    `story capture matrix: ${matrix.storyId} profiles=${joinLabels(matrix.profiles.map((profile) => profile.id))} variants=${joinLabels(matrix.variants.map((variant) => variant.id))}`,
    `missingModes=${joinLabels(matrix.missingModes)}`,
  ];

  for (const variant of matrix.variants) {
    lines.push(`variant ${variant.id} (${variant.label})`);
    for (const profile of matrix.profiles) {
      const capture = findCapture(matrix.captures, profile.id, variant.id);
      lines.push(`[${profile.id} ${profile.mode} width=${String(profile.width)}]`);
      lines.push(capture?.output ?? EMPTY_LABEL);
    }
  }

  return lines.join('\n');
}

function missingRequiredModes(
  requiredModes: readonly OutputMode[],
  profiles: readonly StoryCaptureProfile[],
): readonly OutputMode[] {
  const profileModes = new Set(profiles.map((profile) => profile.mode));
  return [...new Set(requiredModes)]
    .filter((mode) => !profileModes.has(mode))
    .sort(compareModes);
}

function findCapture(
  captures: readonly StoryCapture[],
  profileId: string,
  variantId: string,
): StoryCapture | undefined {
  return captures.find((capture) => (
    capture.profileId === profileId
    && capture.variantId === variantId
  ));
}

function compareModes(a: OutputMode, b: OutputMode): number {
  return MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b);
}

function joinLabels(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_LABEL : values.join(LIST_SEPARATOR);
}

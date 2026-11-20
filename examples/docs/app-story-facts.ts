import type { Surface } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { column } from '../_shared/example-surfaces.js';
import type {
  ComponentStory,
  StoryProfilePreset,
} from '../_stories/protocol-types.js';
import { dogfoodText } from './app-localization.js';
import { paragraphSurface } from './app-paragraph-surface.js';

/**
 * Inline reading-path facts: the active variant (with its position and the
 * variant count) and the active profile. They render in the main pane so no
 * required fact depends on the wide-only variants pane or a drawer.
 */
export function renderStoryFacts(
  story: Pick<ComponentStory, 'variants'>,
  variantIndex: number,
  variantLabel: string,
  preset: Pick<StoryProfilePreset, 'label'>,
  width: number,
  localization: LocalizationPort,
): Surface {
  const variantFact = dogfoodText(
    localization,
    'docs.story.facts.variant',
    'Variant {index} of {count}: {label}',
    {
      index: variantIndex + 1,
      count: story.variants.length,
      label: variantLabel,
    },
  );
  const profileFact = dogfoodText(
    localization,
    'docs.story.facts.profile',
    'Profile: {profile}',
    { profile: preset.label },
  );
  return column([
    paragraphSurface(variantFact, width),
    paragraphSurface(profileFact, width),
  ]);
}

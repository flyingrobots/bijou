import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';

/** A Component story that rebuilds its docs, labels, and preview copy through a localization port. */
export interface LocalizableStory<Story extends ComponentStory = ComponentStory> {
  readonly localize: (localization: LocalizationPort) => Story;
}

export function isLocalizableStory(story: ComponentStory): story is ComponentStory & LocalizableStory {
  return 'localize' in story && typeof story.localize === 'function';
}

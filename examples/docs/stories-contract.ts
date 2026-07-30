import type { ComponentStory } from './stories-runtime.js';

export const BIJOU_STORY_PACKAGE = 'bijou' as const;

export interface DogfoodComponentStory<State = void> extends ComponentStory<State> {
  readonly coverageFamilyIds: readonly string[];
}

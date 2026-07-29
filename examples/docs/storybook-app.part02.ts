import { isKeyMsg, isMouseMsg, isResizeMsg, quit, type Cmd } from '../../packages/bijou-tui/src/index.js';
import { resolveStoryProfilePreset, resolveStoryVariant, type ComponentStory } from '../_stories/protocol.js';
import { COMPONENT_STORIES } from './stories.js';
import { focusStory, noStory, pageStory, storyListHeight, syncStoryListHeight } from './storybook-app.part01.js';
import type { StorybookModel, StorybookPageMsg, StorybookRuntimeMsg } from './storybook-app.part01.js';

export function selectedStorybookStory(
  model: StorybookModel,
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
): ComponentStory {
  const storyId = model.storyState.items[model.storyState.focusIndex]?.value;
  return stories.find((story) => story.id === storyId) ?? stories[0] ?? noStory();
}

function cycleVariant(
  model: StorybookModel,
  stories: readonly ComponentStory[],
  delta: number,
): StorybookModel {
  const story = selectedStorybookStory(model, stories);
  const current = model.variantIndexByStory[story.id] ?? 0;
  const count = story.variants.length;
  const next = count === 0 ? 0 : ((current + delta) % count + count) % count;
  return {
    ...model,
    variantIndexByStory: {
      ...model.variantIndexByStory,
      [story.id]: next,
    },
    previewTimeMs: 0,
  };
}

function setProfileIndex(
  model: StorybookModel,
  stories: readonly ComponentStory[],
  index: number,
): StorybookModel {
  const story = selectedStorybookStory(model, stories);
  const next = Math.max(0, Math.min(index, story.profilePresets.length - 1));
  return {
    ...model,
    profileIndexByStory: {
      ...model.profileIndexByStory,
      [story.id]: next,
    },
    previewTimeMs: 0,
  };
}

function updateKey(
  key: string,
  model: StorybookModel,
  stories: readonly ComponentStory[],
): [StorybookModel, Cmd<StorybookPageMsg>[]] {
  switch (key) {
    case 'q':
    case 'escape':
      return [model, [quit()]];
    case 'down':
    case 'j':
    case ']':
      return [focusStory(model, 1), []];
    case 'up':
    case 'k':
    case '[':
      return [focusStory(model, -1), []];
    case 'pagedown':
    case 'd':
      return [pageStory(model, 1), []];
    case 'pageup':
    case 'u':
      return [pageStory(model, -1), []];
    case '.':
      return [cycleVariant(model, stories, 1), []];
    case ',':
      return [cycleVariant(model, stories, -1), []];
    case '1':
    case '2':
    case '3':
    case '4':
      return [setProfileIndex(model, stories, Number(key) - 1), []];
    default:
      return [model, []];
  }
}

function updateStorybookMessage(
  msg: StorybookRuntimeMsg,
  model: StorybookModel,
  stories: readonly ComponentStory[],
): [StorybookModel, Cmd<StorybookPageMsg>[]] {
  if (isResizeMsg(msg)) {
    return [{
      ...model,
      columns: Math.max(1, msg.columns),
      rows: Math.max(1, msg.rows),
      storyState: syncStoryListHeight(model.storyState, storyListHeight(msg.rows)),
    }, []];
  }

  if (msg.type === 'pulse') {
    return [{
      ...model,
      previewTimeMs: model.previewTimeMs + Math.round(Math.max(0, msg.dt) * 1000),
    }, []];
  }

  if (isMouseMsg(msg)) {
    if (msg.action === 'scroll-down') return [focusStory(model, 1), []];
    if (msg.action === 'scroll-up') return [focusStory(model, -1), []];
    return [model, []];
  }

  if (msg.type === 'storybook-key') {
    return updateKey(msg.key, model, stories);
  }

  if (!isKeyMsg(msg)) {
    return [model, []];
  }

  return updateKey(msg.key, model, stories);
}

function selectedVariant(model: StorybookModel, story: ComponentStory) {
  return resolveStoryVariant(story, model.variantIndexByStory[story.id] ?? 0);
}

function selectedProfile(model: StorybookModel, story: ComponentStory) {
  return resolveStoryProfilePreset(story, model.profileIndexByStory[story.id] ?? 0);
}

export { selectedProfile, selectedVariant, updateStorybookMessage };

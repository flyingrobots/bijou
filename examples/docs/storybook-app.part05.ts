import type { BijouContext } from '@flyingrobots/bijou';
import { createFramedApp, createKeyMap, type FrameLayoutNode, type FramePage, type FramePageMsg, type FramedApp } from '../../packages/bijou-tui/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { COMPONENT_STORIES } from './stories.js';
import { DEFAULT_TITLE, FOOTER_HINT, NEXT, createInitialStorybookModel } from './storybook-app.part01.js';
import type { StorybookAppOptions, StorybookModel, StorybookPageMsg } from './storybook-app.part01.js';
import { updateStorybookMessage } from './storybook-app.part02.js';
import { renderStorybookBody } from './storybook-app.part04.js';

const storybookPageKeys = createKeyMap<StorybookPageMsg>()
  .group('BlockLab', (group) => group
    .bind('down', NEXT, { type: 'storybook-key', key: 'down' })
    .bind('j', NEXT, { type: 'storybook-key', key: 'j' })
    .bind(']', NEXT, { type: 'storybook-key', key: ']' })
    .bind('up', 'Previous story', { type: 'storybook-key', key: 'up' })
    .bind('k', 'Previous story', { type: 'storybook-key', key: 'k' })
    .bind('[', 'Previous story', { type: 'storybook-key', key: '[' })
    .bind('pagedown', 'Page down', { type: 'storybook-key', key: 'pagedown' })
    .bind('d', 'Page down', { type: 'storybook-key', key: 'd' })
    .bind('pageup', 'Page up', { type: 'storybook-key', key: 'pageup' })
    .bind('u', 'Page up', { type: 'storybook-key', key: 'u' })
    .bind('.', 'Next variant', { type: 'storybook-key', key: '.' })
    .bind(',', 'Previous variant', { type: 'storybook-key', key: ',' })
    .bind('1', 'Profile 1', { type: 'storybook-key', key: '1' })
    .bind('2', 'Profile 2', { type: 'storybook-key', key: '2' })
    .bind('3', 'Profile 3', { type: 'storybook-key', key: '3' })
    .bind('4', 'Profile 4', { type: 'storybook-key', key: '4' }));

export function createStorybookPage(
  ctx: BijouContext,
  stories: readonly ComponentStory[] = COMPONENT_STORIES,
  title = DEFAULT_TITLE,
  initialStoryId?: string,
  localization?: StorybookAppOptions['localization'],
): FramePage<StorybookModel, StorybookPageMsg> {
  return {
    id: 'storybook',
    title: 'BlockLab',
    init: () => [createInitialStorybookModel(ctx, stories, title, initialStoryId), []],
    update(msg: FramePageMsg<StorybookPageMsg>, model) {
      return updateStorybookMessage(msg, model, stories);
    },
    keyMap: storybookPageKeys,
    layout: (model) => ({
      kind: 'pane',
      paneId: 'blocklab-workbench',
      overflowX: 'scroll',
      render: (width, height) => renderStorybookBody({
        ...model,
        columns: width,
        rows: height,
      }, ctx, stories, localization),
    }) satisfies FrameLayoutNode,
  };
}

export function createStorybookFrameApp(
  ctx: BijouContext,
  options: StorybookAppOptions = {},
): FramedApp<StorybookModel, StorybookPageMsg> {
  const stories = options.stories ?? COMPONENT_STORIES;
  const title = options.title ?? DEFAULT_TITLE;

  return createFramedApp<StorybookModel, StorybookPageMsg>({
    ctx,
    title,
    initialColumns: ctx.runtime.columns,
    initialRows: ctx.runtime.rows,
    keyPriority: 'page-first',
    helpLineSource: () => FOOTER_HINT,
    pages: [
      createStorybookPage(
        ctx,
        stories,
        title,
        options.initialStoryId,
        options.localization,
      ),
    ],
  });
}

export const createBlockLabFrameApp = createStorybookFrameApp;

import { createSurface, inspector, type BijouContext, type Surface } from '@flyingrobots/bijou';
import type { App } from '../../packages/bijou-tui/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { contentSurface, line } from '../_shared/example-surfaces.js';
import { COMPONENT_STORIES } from './stories.js';
import { DEFAULT_TITLE, FOOTER_HINT, REQUIRED_MODES, createInitialStorybookModel } from './storybook-app.part01.js';
import type { StorybookAppOptions, StorybookModel, StorybookPageMsg } from './storybook-app.part01.js';
import { selectedProfile, selectedStorybookStory, selectedVariant, updateStorybookMessage } from './storybook-app.part02.js';
import { fit, paneSurface, renderCatalogPane, renderHeader, renderPreviewPane } from './storybook-app.part03.js';

function renderTestingPane(
  model: StorybookModel,
  story: ComponentStory,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const bodyWidth = Math.max(20, width - 4);
  const profileModes = new Set(story.profilePresets.map((profile) => profile.mode));
  const missingModes = REQUIRED_MODES.filter((mode) => !profileModes.has(mode));
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);
  const modeStatus = REQUIRED_MODES
    .map((mode) => `${mode}: ${profileModes.has(mode) ? 'ready' : 'missing'}`)
    .join('\n');
  const source = story.source?.examplePath ?? 'No source path registered.';

  const content = contentSurface(inspector({
    title: 'test matrix',
    currentValue: missingModes.length === 0 ? 'all required modes' : `missing ${missingModes.join(', ')}`,
    sections: [
      {
        title: 'Selection',
        content: [
          `story=${story.id}`,
          `variant=${variant.id}`,
          `profile=${profile.id}`,
        ].join('\n'),
      },
      {
        title: 'Coverage',
        content: `${String(story.profilePresets.length)} profiles x ${String(story.variants.length)} variants`,
      },
      {
        title: 'Required modes',
        content: modeStatus,
        tone: missingModes.length === 0 ? 'default' : 'muted',
      },
      {
        title: 'Source',
        content: source,
        tone: 'muted',
      },
    ],
    width: bodyWidth,
    ctx,
  }));

  return paneSurface('testing', content, width, height, ctx);
}

function renderStorybookBody(
  model: StorybookModel,
  ctx: BijouContext,
  stories: readonly ComponentStory[],
  localization?: StorybookAppOptions['localization'],
): Surface {
  const screen = createSurface(model.columns, model.rows);
  const story = selectedStorybookStory(model, stories);

  if (model.columns >= 116 && model.rows >= 12) {
    const catalogWidth = 34;
    const testingWidth = 36;
    const previewWidth = Math.max(20, model.columns - catalogWidth - testingWidth);
    screen.blit(renderCatalogPane(model, catalogWidth, model.rows, ctx, localization), 0, 0);
    screen.blit(renderPreviewPane(model, story, previewWidth, model.rows, ctx), catalogWidth, 0);
    screen.blit(renderTestingPane(model, story, testingWidth, model.rows, ctx), catalogWidth + previewWidth, 0);
  } else if (model.columns >= 76 && model.rows >= 10) {
    const catalogWidth = 30;
    const previewWidth = Math.max(20, model.columns - catalogWidth);
    screen.blit(renderCatalogPane(model, catalogWidth, model.rows, ctx, localization), 0, 0);
    screen.blit(renderPreviewPane(model, story, previewWidth, model.rows, ctx), catalogWidth, 0);
  } else {
    screen.blit(renderPreviewPane(model, story, model.columns, model.rows, ctx), 0, 0);
  }

  return screen;
}

function renderStorybook(
  model: StorybookModel,
  ctx: BijouContext,
  stories: readonly ComponentStory[],
  localization?: StorybookAppOptions['localization'],
): Surface {
  const screen = createSurface(model.columns, model.rows);
  const story = selectedStorybookStory(model, stories);
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);

  screen.blit(renderHeader(model, story, variant.label, profile.label), 0, 0);

  const bodyTop = 1;
  const bodyHeight = Math.max(1, model.rows - 2);
  screen.blit(
    renderStorybookBody({ ...model, rows: bodyHeight }, ctx, stories, localization),
    0,
    bodyTop,
  );

  screen.blit(line(fit(FOOTER_HINT, model.columns), model.columns), 0, model.rows - 1);
  return screen;
}

export function createStorybookApp(
  ctx: BijouContext,
  options: StorybookAppOptions = {},
): App<StorybookModel, StorybookPageMsg> {
  const stories = options.stories ?? COMPONENT_STORIES;
  const title = options.title ?? DEFAULT_TITLE;

  return {
    init() {
      return [createInitialStorybookModel(ctx, stories, title, options.initialStoryId), []];
    },

    update(msg, model) {
      return updateStorybookMessage(msg, model, stories);
    },

    view(model) {
      return renderStorybook(model, ctx, stories, options.localization);
    },
  };
}

export { renderStorybookBody };

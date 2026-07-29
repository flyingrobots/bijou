import { boxSurface, markdown, separatorSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { browsableListSurface, viewportSurface } from '../../packages/bijou-tui/src/index.js';
import { createStoryProfileContext, storyDocsMarkdown, storyPreviewSurface, type ComponentStory } from '../_stories/protocol.js';
import { column, line, proseSurface, spacer } from '../_shared/example-surfaces.js';
import { syncStoryListHeight } from './storybook-app.part01.js';
import type { StorybookModel } from './storybook-app.part01.js';
import { selectedProfile, selectedVariant } from './storybook-app.part02.js';

function fit(text: string, width: number): string {
  const targetWidth = Math.max(1, Math.floor(width));
  if (text.length <= targetWidth) {
    return text.padEnd(targetWidth);
  }
  if (targetWidth <= 1) return text.slice(0, 1);
  return `${text.slice(0, targetWidth - 1)}>`;
}

function renderHeader(
  model: StorybookModel,
  story: ComponentStory,
  variantLabel: string,
  profileLabel: string,
): Surface {
  const text = `${model.title} | ${story.id} | ${variantLabel} | ${profileLabel}`;
  return line(fit(text, model.columns), model.columns);
}

function paneSurface(
  title: string,
  content: Surface,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const paneWidth = Math.max(1, Math.floor(width));
  const paneHeight = Math.max(1, Math.floor(height));
  const boxed = boxSurface(content, {
    title,
    width: paneWidth,
    padding: { left: 1, right: 1 },
    ctx,
  });

  return viewportSurface({
    width: paneWidth,
    height: paneHeight,
    content: boxed,
    showScrollbar: boxed.height > paneHeight,
  });
}

function renderCatalogPane(
  model: StorybookModel,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const listHeight = Math.max(1, height - 6);
  const listState = syncStoryListHeight(model.storyState, listHeight);
  const bodyWidth = Math.max(1, width - 4);
  const list = browsableListSurface(listState, {
    width: bodyWidth,
    showScrollbar: true,
    focusIndicator: '>',
    focusedRowOverflow: { mode: 'marquee', elapsedMs: model.previewTimeMs },
    ctx,
  });

  const content = column([
    separatorSurface({ label: `${String(model.storyState.items.length)} stories`, width: bodyWidth, ctx }),
    spacer(),
    list,
  ]);

  return paneSurface('catalog', content, width, height, ctx);
}

function renderPreviewPane(
  model: StorybookModel,
  story: ComponentStory,
  width: number,
  height: number,
  ctx: BijouContext,
): Surface {
  const bodyWidth = Math.max(20, width - 4);
  const variant = selectedVariant(model, story);
  const profile = selectedProfile(model, story);
  const previewWidth = Math.max(20, Math.min(profile.width, bodyWidth - 4));
  const previewHeight = Math.max(6, Math.min(18, height - 12));
  const previewCtx = createStoryProfileContext(ctx, profile, {
    width: previewWidth,
    height: previewHeight,
  });
  const preview = storyPreviewSurface(variant.render({
    width: previewWidth,
    ctx: previewCtx,
    state: variant.initialState,
    timeMs: model.previewTimeMs,
  }));
  const previewTitle = `${profile.label} / ${variant.label}`;
  const previewCard = boxSurface(preview, {
    title: previewTitle,
    width: Math.max(24, Math.min(bodyWidth, Math.max(preview.width + 4, previewTitle.length + 4))),
    padding: { left: 1, right: 1 },
    ctx,
  });
  const docsWidth = Math.max(20, bodyWidth - 2);
  const docs = proseSurface(markdown(storyDocsMarkdown(story, variant, profile), {
    width: docsWidth,
    ctx,
  }), docsWidth);

  return paneSurface('preview', column([
    line(fit(story.title, bodyWidth), bodyWidth),
    spacer(),
    previewCard,
    spacer(),
    docs,
  ]), width, height, ctx);
}

export { fit, paneSurface, renderCatalogPane, renderHeader, renderPreviewPane };

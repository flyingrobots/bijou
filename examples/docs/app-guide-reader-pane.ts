import {
  markdown,
  type BijouContext,
  type Surface,
} from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  column,
  proseSurface,
  spacer,
} from '../_shared/example-surfaces.js';
import { BLOCK_PREVIEW_PANE_CHROME } from './app-block-preview-chrome.js';
import {
  renderBlocksPreviewPane,
  renderCounterDemoPreviewPane,
} from './app-block-preview-panes.js';
import {
  guideDocBody,
  guideDocTitle,
} from './app-guide-access.js';
import { selectedGuide } from './app-guide-navigation.js';
import { renderUnpublishedGuide } from './app-guide-unpublished.js';
import { standardBlockForPreviewGuide } from './app-guides-blocks.js';
import {
  COUNTER_DEMO_BLOCK_GUIDE_ID,
  THEME_LAB_GUIDE_ID,
  type DocsPageId,
} from './app-ids.js';
import type { LandingThemeTokens } from './app-landing.js';
import type { DocsExplorerModel } from './app-model.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import {
  DOCS_SHELL_THEME_CHOICES,
} from './app-shell-theme-state.js';
import { renderThemeLabPane } from './app-theme-lab.js';
import { resolveDocsShellThemeById } from './app-theme-state.js';
import { countMarkdownHeadings } from './app-markdown.js';
import { documentationArticleBlock } from './dogfood-blocks.js';

export function renderGuideReaderPane(
  pageId: DocsPageId,
  model: DocsExplorerModel,
  width: number,
  context: BijouContext,
  theme: LandingThemeTokens,
  localization: LocalizationPort,
): Surface {
  const paneWidth = resolvePaneInnerWidth(width);
  const doc = selectedGuide(pageId, model);
  if (doc == null) {
    return renderUnpublishedGuide(
      width,
      paneWidth,
      context,
      theme,
      localization,
    );
  }
  const standardBlock = standardBlockForPreviewGuide(doc);
  if (standardBlock !== undefined) {
    return renderBlocksPreviewPane(
      standardBlock,
      width,
      context,
      theme,
      localization,
      BLOCK_PREVIEW_PANE_CHROME,
    );
  }
  if (doc.id === COUNTER_DEMO_BLOCK_GUIDE_ID) {
    return renderCounterDemoPreviewPane(
      model.counterBlockDemo,
      width,
      context,
      theme,
      localization,
      BLOCK_PREVIEW_PANE_CHROME,
    );
  }
  if (doc.id === THEME_LAB_GUIDE_ID) {
    return renderThemeLabPane({
      width,
      ctx: context,
      landingTheme: theme,
      activeTheme: resolveDocsShellThemeById(model.activeShellThemeId),
      shellThemes: DOCS_SHELL_THEME_CHOICES,
      editorState: model.themeLabEditor,
      localization,
    });
  }
  const docsWidth = Math.max(24, paneWidth - 2);
  const title = guideDocTitle(doc, localization);
  const body = guideDocBody(doc, localization);
  const article = documentationArticleBlock.render({
    config: {
      title,
      body,
      headingCount: countMarkdownHeadings(body),
    },
    mode: context.mode,
  });
  return insetPaneSurface(
    column([
      themedSeparatorSurface(
        `docs • ${title}`,
        paneWidth,
        context,
        theme,
      ),
      spacer(1, 1),
      proseSurface(
        markdown(article.output, {
          width: docsWidth,
          ctx: context,
        }),
        docsWidth,
      ),
    ]),
    width,
  );
}

import { createSurface, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import {
  createFramedApp,
  isPulseMsg,
  type FramedApp,
  type FrameLayoutNode,
  type FramePage,
  type FramePageMsg,
} from '../../packages/bijou-tui/src/index.js';
import { DOGFOOD_SHELL_THEMES } from '../docs/dogfood-shell-themes.js';
import { COMPONENT_STORIES } from '../docs/stories.js';
import { docsSurface } from './library-docs.js';
import { createLibraryI18n, physical, setLibraryDirection } from './library-direction.js';
import {
  FAMILIES, INTRO_IN, INTRO_OUT, initialModel, LEGEND, MAX_WIDTH, SEARCH_ITEMS, wrap, libraryKeys,
  type LibraryModel, type LibraryMsg,
} from './library-model.js';
import type { LibraryStart } from './library-cli.js';
import { introBody } from './library-intro.js';
import { familyTarget, showSlide, stepTarget } from './library-nav.js';
import { endSlide } from './library-wordmark.js';
import { progressRow } from './library-progress.js';
import { titleSlide } from './library-stages.js';
import { carousel, dots, heading, modeRow, stack } from './library-view.js';

export { LIBRARY_CSS } from './library-view.js';
export { LIBRARY_MODES, type LibraryModel, type LibraryMsg } from './library-model.js';

export function createLibraryApp(baseCtx: BijouContext, start: LibraryStart = {}): FramedApp<LibraryModel, LibraryMsg> {
  // F2 settings can switch shell theme; components re-render with the themed context.
  let ctx = baseCtx;
  const i18n = createLibraryI18n();
  if (start.rtl === true) setLibraryDirection(i18n, true);
  // How far the body can scroll, measured by the last render; keeps j/k inside the content.
  let maxScroll = 0;

  // The last body drawn, so a family intro can transition out of whatever was on screen.
  let lastBody: Surface | undefined;
  let introFrom: Surface | undefined;

  /** Move to a component; crossing into another family (or leaving the title) plays its intro. */
  /** Show a deck slide; entering a family slide transitions out of whatever was on screen. */
  function show(model: LibraryModel, key: string | undefined): LibraryModel {
    if (key === undefined) return model;
    const next = showSlide(model, key);
    if (next.stage === 'intro') introFrom = lastBody;
    return next;
  }

  function update(msg: FramePageMsg<LibraryMsg>, model: LibraryModel): LibraryModel {
    if (isPulseMsg(msg)) {
      const time = model.time + msg.dt;
      const leaving = model.stage === 'intro' && model.introExitAt !== undefined && time - model.introExitAt >= INTRO_OUT;
      return leaving ? { ...model, time, stage: 'component', introExitAt: undefined } : { ...model, time };
    }
    if (!('type' in msg) || msg.type === 'mouse') return model;
    const forward = msg.type === 'library-start' || ((msg.type === 'library-step' || msg.type === 'library-variant' || msg.type === 'library-family') && msg.delta > 0);
    // From the title, forward keys start the deck; nothing comes before the title.
    if (model.stage === 'title') return forward ? show(model, stepTarget(model, 1)) : model;
    // On a family slide, forward keys leave the slide (into its first component); back goes to the previous family.
    if (model.stage === 'intro' && model.introExitAt === undefined && forward && msg.type !== 'library-family') {
      return { ...model, introExitAt: Math.max(model.time, model.introAt + INTRO_IN) };
    }
    switch (msg.type) {
      // One slide at a time, in deck order; the deck does not wrap.
      case 'library-step': return show(model, stepTarget(model, msg.delta));
      case 'library-select': return show(model, `component:${String(msg.index)}`);
      case 'library-family': return show(model, familyTarget(model, msg.delta));
      case 'library-variant': {
        const n = COMPONENT_STORIES[model.index]?.variants.length ?? 1;
        if (n < 2) return model;
        return { ...model, variantIndex: wrap(model.variantIndex + msg.delta, n), slide: { from: model.variantIndex, at: model.time, dir: msg.delta > 0 ? 1 : -1 } };
      }
      case 'library-scroll': return { ...model, scroll: Math.max(0, Math.min(maxScroll, model.scroll + msg.delta)) };
      case 'library-mode': return { ...model, modeIndex: msg.index };
      case 'library-info': return { ...model, docs: !model.docs, scroll: 0 };
      case 'library-rtl': setLibraryDirection(i18n, !model.rtl); return { ...model, rtl: !model.rtl };
      case 'library-start': return model;
    }
  }

  // Rows: the deck-wide progress bar, the body, then the mode row (absent on the title screen).
  function renderBody(model: LibraryModel, width: number, height: number): Surface {
    if (height < 3) return createSurface(width, height);
    const bodyH = height - 2;
    const component = (): Surface => componentBody(model, width, bodyH);
    const body = model.stage === 'title' ? titleSlide(width, bodyH, FAMILIES.length, COMPONENT_STORIES.length, ctx, model.rtl)
      : model.stage === 'end' ? endSlide(width, bodyH, COMPONENT_STORIES.length, FAMILIES.length, ctx)
      : model.stage === 'intro' ? introBody(model, width, bodyH, ctx, introFrom, component) : component();
    lastBody = body;
    const screen = createSurface(width, height);
    screen.blit(progressRow(model, width, ctx), 0, 0);
    screen.blit(body, 0, 1);
    if (model.stage === 'title' || model.stage === 'end') return screen;
    const hint = model.stage === 'component' && maxScroll > 0 ? `${model.scroll > 0 ? '↑' : ' '}${model.scroll < maxScroll ? '↓' : ' '} j/k` : '';
    modeRow(screen, height - 1, model, hint, ctx);
    return screen;
  }

  function componentBody(model: LibraryModel, width: number, bodyH: number): Surface {
    const screen = createSurface(width, bodyH);
    const story = COMPONENT_STORIES[model.index];
    if (story === undefined) return screen;
    const parts = [heading(story, model, ctx, width), carousel(story, model, ctx, width, bodyH)];
    if (story.variants.length > 1) parts.push(dots(story, model, width, ctx));
    if (model.docs) parts.push(docsSurface(story, wrap(model.variantIndex, story.variants.length), Math.min(width - 8, MAX_WIDTH), ctx, model.rtl));
    const content = stack(parts, width);
    maxScroll = Math.max(0, content.height - bodyH);
    const offset = Math.min(model.scroll, maxScroll);
    if (maxScroll === 0) screen.blit(content, 0, Math.floor((bodyH - content.height) / 2));
    else screen.blit(content, 0, 0, 0, offset, width, bodyH);
    return screen;
  }

  const page: FramePage<LibraryModel, LibraryMsg> = {
    id: 'components',
    title: 'Components',
    init: () => [initialModel(start), []],
    update: (msg, model) => [update('type' in msg && (msg.type === 'library-step' || msg.type === 'library-family') ? physical(msg, model.rtl) : msg, model), []],
    keyMap: libraryKeys,
    searchItems: () => SEARCH_ITEMS,
    searchTitle: 'Components',
    // A single pane, so the frame draws no focus gutter and the page uses the full width.
    layout: (model) => ({ kind: 'pane', paneId: 'library', render: (width, height) => renderBody(model, width, height) }) satisfies FrameLayoutNode,
  };
  return createFramedApp<LibraryModel, LibraryMsg>({
    ctx: baseCtx,
    title: 'Components',
    initialColumns: baseCtx.runtime.columns,
    initialRows: baseCtx.runtime.rows,
    keyPriority: 'page-first',
    enableCommandPalette: true,
    helpLineSource: () => LEGEND,
    shellThemes: DOGFOOD_SHELL_THEMES,
    onShellThemeChange: ({ ctx: themed }) => { ctx = themed; },
    i18n,
    // No header row: the page's own top row carries the deck-wide progress bar.
    bodyTopRows: 0,
    pages: [page],
  });
}

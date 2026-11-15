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
  FAMILIES, INTRO_IN, INTRO_OUT, initialModel, LEGEND, liveVariant, MAX_WIDTH, SEARCH_ITEMS, wrap, libraryKeys,
  type LibraryModel, type LibraryMsg,
} from './library-model.js';
import type { LibraryStart } from './library-cli.js';
import { introBody } from './library-intro.js';
import { familyStepper, progressRow } from './library-progress.js';
import { titleSlide } from './library-stages.js';
import { carousel, dots, heading, hiddenGutter, modeRow, stack } from './library-view.js';

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
  function goTo(model: LibraryModel, index: number, force: boolean): LibraryModel {
    const next = { ...model, index, variantIndex: liveVariant(index), scroll: 0, slide: undefined };
    const crossed = force || COMPONENT_STORIES[index]?.family !== COMPONENT_STORIES[model.index]?.family;
    if (!crossed) return { ...next, stage: 'component' };
    introFrom = lastBody;
    return { ...next, stage: 'intro', introAt: model.time, introExitAt: undefined };
  }

  function update(msg: FramePageMsg<LibraryMsg>, model: LibraryModel): LibraryModel {
    if (isPulseMsg(msg)) {
      const time = model.time + msg.dt;
      const leaving = model.stage === 'intro' && model.introExitAt !== undefined && time - model.introExitAt >= INTRO_OUT;
      return leaving ? { ...model, time, stage: 'component', introExitAt: undefined } : { ...model, time };
    }
    if (!('type' in msg) || msg.type === 'mouse') return model;
    // From the title, any library key starts with the first family's intro.
    if (model.stage === 'title') return goTo(model, model.index, true);
    // On a family slide, forward keys leave the slide (into its first component); back goes to the previous family.
    if (model.stage === 'intro' && model.introExitAt === undefined) {
      const forward = msg.type === 'library-start' || (msg.type === 'library-step' && msg.delta > 0) || (msg.type === 'library-variant' && msg.delta > 0);
      if (forward) return { ...model, introExitAt: Math.max(model.time, model.introAt + INTRO_IN) };
    }
    switch (msg.type) {
      case 'library-step': return goTo(model, wrap(model.index + msg.delta, COMPONENT_STORIES.length), false);
      case 'library-select': return goTo(model, msg.index, false);
      case 'library-family': {
        // Jump to the first component of the previous or next family, which plays its intro slide.
        const fi = FAMILIES.indexOf(COMPONENT_STORIES[model.index]?.family ?? '');
        const family = FAMILIES[wrap(fi + msg.delta, FAMILIES.length)];
        return goTo(model, Math.max(0, COMPONENT_STORIES.findIndex((s) => s.family === family)), true);
      }
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

  // Rows: the body, then the mode row (absent on the title screen). The progress bar is an overlay.
  function renderBody(model: LibraryModel, width: number, height: number): Surface {
    if (height < 2) return createSurface(width, height);
    const bodyH = height - 1;
    const component = (): Surface => componentBody(model, width, bodyH);
    const body = model.stage === 'title' ? titleSlide(width, bodyH, FAMILIES.length, COMPONENT_STORIES.length, ctx, model.rtl)
      : model.stage === 'intro' ? introBody(model, width, bodyH, ctx, introFrom, component) : component();
    lastBody = body;
    const screen = createSurface(width, height);
    screen.blit(body, 0, 0);
    if (model.stage === 'title') return screen;
    const hint = model.stage === 'component' && maxScroll > 0 ? `${model.scroll > 0 ? '↑' : ' '}${model.scroll < maxScroll ? '↓' : ' '} j/k` : '';
    modeRow(screen, height - 1, model, hint);
    return screen;
  }

  function componentBody(model: LibraryModel, width: number, bodyH: number): Surface {
    const screen = createSurface(width, bodyH);
    const story = COMPONENT_STORIES[model.index];
    if (story === undefined) return screen;
    const parts = [heading(story, model, ctx, width), familyStepper(story.family, model.index, width - 8, ctx), carousel(story, model, ctx, width, bodyH)];
    if (story.variants.length > 1) parts.push(dots(story, model, width));
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
    layout: (model) => {
      const hidden = hiddenGutter(ctx);
      return {
        kind: 'pane', paneId: 'library', focusedGutterToken: hidden, unfocusedGutterToken: hidden,
        render: (width, height) => renderBody(model, width, height),
      } satisfies FrameLayoutNode;
    },
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
    // The show-wide progress bar replaces the frame header: full width, on the top row, outside the pane gutter.
    overlayFactory: ({ pageModel, screenRect }) => [{ content: '', surface: progressRow(pageModel, screenRect.width, ctx), row: 0, col: 0 }],
    pages: [page],
  });
}

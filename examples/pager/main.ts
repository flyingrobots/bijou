import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isResizeMsg, type App,
  createPagerStateForSurface, pagerScrollBy, pagerPageDown, pagerPageUp,
  pagerSurface,
  pagerScrollToTop, pagerScrollToBottom, pagerKeyMap, helpShort, type PagerState,
} from '@flyingrobots/bijou-tui';
import { column, contentSurface, line } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

// Generate some content to page through
const CONTENT = Array.from({ length: 80 }, (_, i) => {
  if (i === 0) return '  Welcome to the bijou pager!';
  if (i % 10 === 0) return `  ── Section ${i / 10} ──`;
  return `  Line ${i}: ${'Lorem ipsum dolor sit amet'.repeat(Math.ceil(Math.random() * 2))}`;
}).join('\n');
const CONTENT_SURFACE = contentSurface(CONTENT);

type Msg =
  | { type: 'scroll'; dy: number }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'quit' };

const keys = pagerKeyMap<Msg>({
  scrollUp: { type: 'scroll', dy: -1 },
  scrollDown: { type: 'scroll', dy: 1 },
  pageUp: { type: 'page-up' },
  pageDown: { type: 'page-down' },
  top: { type: 'top' },
  bottom: { type: 'bottom' },
  quit: { type: 'quit' },
});

interface Model {
  pager: PagerState;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = ctx.runtime.columns;
    const rows = ctx.runtime.rows;
    return [{
      pager: createPagerStateForSurface(CONTENT_SURFACE, { width: cols, height: rows - 2 }),
      cols,
      rows,
    }, []];
  },

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      const p = createPagerStateForSurface(CONTENT_SURFACE, { width: msg.columns, height: msg.rows - 2 });
      // Preserve scroll position across resize
      const clampedY = Math.min(model.pager.scroll.y, p.scroll.maxY);
      return [{ ...model, pager: { ...p, scroll: { ...p.scroll, y: clampedY } }, cols: msg.columns, rows: msg.rows }, []];
    }

    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'scroll': return [{ ...model, pager: pagerScrollBy(model.pager, action.dy) }, []];
        case 'page-up': return [{ ...model, pager: pagerPageUp(model.pager) }, []];
        case 'page-down': return [{ ...model, pager: pagerPageDown(model.pager) }, []];
        case 'top': return [{ ...model, pager: pagerScrollToTop(model.pager) }, []];
        case 'bottom': return [{ ...model, pager: pagerScrollToBottom(model.pager) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const header = separator({ label: 'pager', width: model.cols });
    const body = pagerSurface(CONTENT_SURFACE, model.pager);
    const help = `  ${helpShort(keys)}`;
    return column([
      contentSurface(header),
      body,
      line(help, model.cols),
    ]);
  },
};

run(app);

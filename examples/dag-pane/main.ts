import { initDefaultContext } from '@flyingrobots/bijou-node';
import { getDefaultContext } from '@flyingrobots/bijou';
import { separator } from '@flyingrobots/bijou';
import type { DagNode } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isResizeMsg, type App,
  createDagPaneState, dagPane,
  dagPaneSelectChild, dagPaneSelectParent,
  dagPaneSelectLeft, dagPaneSelectRight,
  dagPaneScrollBy, dagPaneScrollByX,
  dagPaneScrollToTop, dagPaneScrollToBottom,
  dagPanePageDown, dagPanePageUp,
  dagPaneKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';
import { ansiSurface } from '../_shared/v3.ts';

initDefaultContext();
const ctx = getDefaultContext();

// Sample project dependency graph
const nodes: DagNode[] = [
  { id: 'core', label: 'Core Library', edges: ['api', 'cli', 'web'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'api', label: 'REST API', edges: ['auth', 'db'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'cli', label: 'CLI Tool', edges: ['auth'], badge: 'WIP', token: { hex: '#f9e2af' } },
  { id: 'web', label: 'Web Frontend', edges: ['auth', 'ui'], badge: 'WIP', token: { hex: '#f9e2af' } },
  { id: 'auth', label: 'Auth Module', edges: ['deploy'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'db', label: 'Database Layer', edges: ['deploy'], badge: 'DONE', token: { hex: '#a6e3a1' } },
  { id: 'ui', label: 'UI Components', edges: ['deploy'], badge: '3d', token: { hex: '#89b4fa' } },
  { id: 'deploy', label: 'Deploy Pipeline', badge: 'BLOCKED', token: { hex: '#f38ba8' } },
];

type Msg =
  | { type: 'select-parent' }
  | { type: 'select-child' }
  | { type: 'select-left' }
  | { type: 'select-right' }
  | { type: 'scroll'; dy: number }
  | { type: 'scroll-left' }
  | { type: 'scroll-right' }
  | { type: 'page-up' }
  | { type: 'page-down' }
  | { type: 'top' }
  | { type: 'bottom' }
  | { type: 'confirm' }
  | { type: 'quit' };

const keys = dagPaneKeyMap<Msg>({
  selectParent: { type: 'select-parent' },
  selectChild: { type: 'select-child' },
  selectLeft: { type: 'select-left' },
  selectRight: { type: 'select-right' },
  scrollUp: { type: 'scroll', dy: -1 },
  scrollDown: { type: 'scroll', dy: 1 },
  scrollLeft: { type: 'scroll-left' },
  scrollRight: { type: 'scroll-right' },
  pageUp: { type: 'page-up' },
  pageDown: { type: 'page-down' },
  top: { type: 'top' },
  bottom: { type: 'bottom' },
  confirm: { type: 'confirm' },
  quit: { type: 'quit' },
});

interface Model {
  pane: ReturnType<typeof createDagPaneState>;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    return [{
      pane: createDagPaneState({
        source: nodes,
        width: Math.max(1, cols),
        height: Math.max(1, rows - 3),
        ctx,
      }),
      cols,
      rows,
    }, []];
  },

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      return [{
        ...model,
        pane: createDagPaneState({
          source: nodes,
          width: Math.max(1, msg.columns),
          height: Math.max(1, msg.rows - 3),
          selectedId: model.pane.selectedId,
          ctx,
        }),
        cols: msg.columns,
        rows: msg.rows,
      }, []];
    }

    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'confirm': return [model, [quit()]];
        case 'select-parent': return [{ ...model, pane: dagPaneSelectParent(model.pane, ctx) }, []];
        case 'select-child': return [{ ...model, pane: dagPaneSelectChild(model.pane, ctx) }, []];
        case 'select-left': return [{ ...model, pane: dagPaneSelectLeft(model.pane, ctx) }, []];
        case 'select-right': return [{ ...model, pane: dagPaneSelectRight(model.pane, ctx) }, []];
        case 'scroll': return [{ ...model, pane: dagPaneScrollBy(model.pane, action.dy) }, []];
        case 'scroll-left': return [{ ...model, pane: dagPaneScrollByX(model.pane, -3) }, []];
        case 'scroll-right': return [{ ...model, pane: dagPaneScrollByX(model.pane, 3) }, []];
        case 'page-up': return [{ ...model, pane: dagPanePageUp(model.pane) }, []];
        case 'page-down': return [{ ...model, pane: dagPanePageDown(model.pane) }, []];
        case 'top': return [{ ...model, pane: dagPaneScrollToTop(model.pane) }, []];
        case 'bottom': return [{ ...model, pane: dagPaneScrollToBottom(model.pane) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const selected = model.pane.selectedId ?? 'none';
    const header = separator({ label: `dag pane — selected: ${selected}`, width: model.cols, ctx });
    const body = dagPane(model.pane, { focused: true, ctx });
    const help = `  ${helpShort(keys)}`;
    return ansiSurface(vstack(header, body, help), model.cols, model.rows);
  },
};

run(app);

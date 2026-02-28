import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createCommandPaletteState, commandPalette,
  cpFilter, cpFocusNext, cpFocusPrev, cpPageDown, cpPageUp, cpSelectedItem,
  commandPaletteKeyMap, helpShort, vstack,
  type CommandPaletteItem,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

const items: CommandPaletteItem[] = [
  { id: 'box', label: 'box()', description: 'Bordered containers', category: 'Display' },
  { id: 'table', label: 'table()', description: 'Auto-spacing data grids', category: 'Display' },
  { id: 'dag', label: 'dag()', description: 'Directed acyclic graph', category: 'Display' },
  { id: 'spinner', label: 'spinner()', description: 'Loading indicator', category: 'Feedback' },
  { id: 'progress', label: 'progressBar()', description: 'Visual progress', category: 'Feedback' },
  { id: 'select', label: 'select()', description: 'Single-select menu', category: 'Forms', shortcut: 'ctrl+k' },
  { id: 'input', label: 'input()', description: 'Text input prompt', category: 'Forms' },
  { id: 'confirm', label: 'confirm()', description: 'Yes/no prompt', category: 'Forms' },
  { id: 'wizard', label: 'wizard()', description: 'Multi-step form', category: 'Forms' },
  { id: 'accordion', label: 'accordion()', description: 'Expandable sections', category: 'Layout' },
  { id: 'tabs', label: 'tabs()', description: 'Tab bar navigation', category: 'Navigation' },
  { id: 'tree', label: 'tree()', description: 'Hierarchical tree', category: 'Display' },
];

type Msg =
  | KeyMsg
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'page-down' }
  | { type: 'page-up' }
  | { type: 'select' }
  | { type: 'close' };

const keys = commandPaletteKeyMap<Msg>({
  focusNext: { type: 'next' },
  focusPrev: { type: 'prev' },
  pageDown: { type: 'page-down' },
  pageUp: { type: 'page-up' },
  select: { type: 'select' },
  close: { type: 'close' },
});

interface Model {
  cp: ReturnType<typeof createCommandPaletteState>;
}

const app: App<Model, Msg> = {
  init: () => [{ cp: createCommandPaletteState(items, 8) }, []],

  update: (msg, model) => {
    if (msg.type === 'key') {
      // Let keymap handle navigation keys first
      const action = keys.handle(msg);
      if (action) {
        switch (action.type) {
          case 'close': return [model, [quit()]];
          case 'select': return [model, [quit()]];
          case 'next': return [{ ...model, cp: cpFocusNext(model.cp) }, []];
          case 'prev': return [{ ...model, cp: cpFocusPrev(model.cp) }, []];
          case 'page-down': return [{ ...model, cp: cpPageDown(model.cp) }, []];
          case 'page-up': return [{ ...model, cp: cpPageUp(model.cp) }, []];
        }
      }

      // Printable character → update filter
      if (msg.key.length === 1 && !msg.ctrl && !msg.alt) {
        const newQuery = model.cp.query + msg.key;
        return [{ ...model, cp: cpFilter(model.cp, newQuery) }, []];
      }

      // Backspace → remove last char from query
      if (msg.key === 'backspace') {
        const newQuery = model.cp.query.slice(0, -1);
        return [{ ...model, cp: cpFilter(model.cp, newQuery) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const header = separator({ label: 'command palette', ctx });
    const body = commandPalette(model.cp, { width: 60, ctx });
    const help = `  ${helpShort(keys)}`;
    return vstack('', header, '', body, '', help, '');
  },
};

run(app);

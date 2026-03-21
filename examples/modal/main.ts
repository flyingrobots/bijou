import { initDefaultContext } from '@flyingrobots/bijou-node';
import { kbd } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, type App, type KeyMsg,
  compositeSurface, createKeyMap, createInputStack, helpShort, modal,
} from '@flyingrobots/bijou-tui';
import { column, line, screenSurface, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

interface Model {
  items: string[];
  selected: number;
  modal: 'none' | 'help' | 'confirm';
  deleteTarget: number;
}

type Msg =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'show-help' }
  | { type: 'show-confirm' }
  | { type: 'confirm-yes' }
  | { type: 'close-modal' }
  | { type: 'quit' };

const appKeys = createKeyMap<Msg>()
  .bind('j', 'Down', { type: 'down' })
  .bind('k', 'Up', { type: 'up' })
  .bind('down', 'Down', { type: 'down' })
  .bind('up', 'Up', { type: 'up' })
  .bind('d', 'Delete', { type: 'show-confirm' })
  .bind('?', 'Help', { type: 'show-help' })
  .bind('q', 'Quit', { type: 'quit' });

const modalKeys = createKeyMap<Msg>()
  .bind('escape', 'Close', { type: 'close-modal' })
  .bind('q', 'Close', { type: 'close-modal' });

const confirmKeys = createKeyMap<Msg>()
  .bind('y', 'Yes', { type: 'confirm-yes' })
  .bind('n', 'No', { type: 'close-modal' })
  .bind('escape', 'Cancel', { type: 'close-modal' });

const ITEMS = [
  'Setup database',
  'Configure auth',
  'Build frontend',
  'Run migrations',
  'Deploy service',
];

const stack = createInputStack<KeyMsg, Msg>();

const app: App<Model, Msg> = {
  init: () => {
    stack.push(appKeys, { name: 'app' });
    return [{ items: [...ITEMS], selected: 0, modal: 'none', deleteTarget: -1 }, []];
  },

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      const action = stack.dispatch(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'up': return [{ ...model, selected: Math.max(0, model.selected - 1) }, []];
        case 'down': return [{ ...model, selected: Math.min(model.items.length - 1, model.selected + 1) }, []];

        case 'show-help':
          stack.push(modalKeys, { name: 'help-modal' });
          return [{ ...model, modal: 'help' }, []];

        case 'show-confirm':
          if (model.items.length === 0) return [model, []];
          stack.push(confirmKeys, { name: 'confirm-modal' });
          return [{ ...model, modal: 'confirm', deleteTarget: model.selected }, []];

        case 'confirm-yes': {
          stack.pop();
          const items = model.items.filter((_, i) => i !== model.deleteTarget);
          const selected = Math.min(model.selected, items.length - 1);
          return [{ ...model, items, selected, modal: 'none', deleteTarget: -1 }, []];
        }

        case 'close-modal':
          stack.pop();
          return [{ ...model, modal: 'none', deleteTarget: -1 }, []];
      }
    }
    return [model, []];
  },

  view: (model) => {
    const rows = [spacer(), line('  Task List'), spacer()];
    for (let i = 0; i < model.items.length; i++) {
      const cursor = i === model.selected ? '>' : ' ';
      rows.push(line(`  ${cursor} ${model.items[i]}`));
    }
    if (model.items.length === 0) rows.push(line('  (empty)'));
    rows.push(spacer());
    rows.push(line(`  ${helpShort(appKeys)}`));
    rows.push(spacer());

    const background = screenSurface(
      ctx.runtime.columns,
      ctx.runtime.rows,
      column(rows),
    );

    if (model.modal === 'help') {
      const body = column([
        line(`${kbd('j')} ${kbd('k')}  Navigate`),
        line(`${kbd('d')}      Delete item`),
        line(`${kbd('?')}      Toggle help`),
        line(`${kbd('q')}      Quit`),
      ]);
      const dialog = modal({
        title: 'Help',
        body,
        hint: line('Press Esc to close'),
        screenWidth: ctx.runtime.columns,
        screenHeight: ctx.runtime.rows,
        borderToken: ctx.border('primary'),
        ctx,
      });
      return compositeSurface(background, [dialog], { dim: true });
    }

    if (model.modal === 'confirm') {
      const item = model.items[model.deleteTarget] ?? '';
      const body = column([
        line(`Delete "${item}"?`),
        spacer(),
        line('This action cannot be undone.'),
      ]);
      const dialog = modal({
        title: 'Confirm delete',
        body,
        hint: line('y yes • n no • Esc cancel'),
        screenWidth: ctx.runtime.columns,
        screenHeight: ctx.runtime.rows,
        borderToken: ctx.border('primary'),
        ctx,
      });
      return compositeSurface(background, [dialog], { dim: true });
    }

    return background;
  },
};

run(app);

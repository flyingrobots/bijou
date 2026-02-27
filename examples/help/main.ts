import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd, separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg,
  createKeyMap, helpView, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Model {
  showHelp: boolean;
  selected: number;
  items: string[];
}

type Msg =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'toggle-help' }
  | { type: 'delete' }
  | { type: 'quit' };

const keys = createKeyMap<Msg>()
  .group('Navigation', (g) => g
    .bind('j', 'Move down', { type: 'down' })
    .bind('k', 'Move up', { type: 'up' })
    .bind('down', 'Move down', { type: 'down' })
    .bind('up', 'Move up', { type: 'up' })
  )
  .group('Actions', (g) => g
    .bind('d', 'Delete item', { type: 'delete' })
    .bind('?', 'Toggle help', { type: 'toggle-help' })
  )
  .group('App', (g) => g
    .bind('q', 'Quit', { type: 'quit' })
  );

const ITEMS = [
  'Install dependencies',
  'Run test suite',
  'Build project',
  'Deploy to staging',
  'Run smoke tests',
  'Deploy to production',
];

const app: App<Model, Msg> = {
  init: () => [{ showHelp: false, selected: 0, items: [...ITEMS] }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'key') {
      const action = keys.handle(msg as KeyMsg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'toggle-help': return [{ ...model, showHelp: !model.showHelp }, []];
        case 'up': return [{ ...model, selected: Math.max(0, model.selected - 1) }, []];
        case 'down': return [{ ...model, selected: Math.min(model.items.length - 1, model.selected + 1) }, []];
        case 'delete': {
          if (model.items.length === 0) return [model, []];
          const items = model.items.filter((_, i) => i !== model.selected);
          const selected = Math.min(model.selected, items.length - 1);
          return [{ ...model, items, selected }, []];
        }
      }
    }
    return [model, []];
  },

  view: (model) => {
    const lines: string[] = ['', '  Task List', ''];

    for (let i = 0; i < model.items.length; i++) {
      const cursor = i === model.selected ? '>' : ' ';
      lines.push(`  ${cursor} ${model.items[i]}`);
    }

    if (model.items.length === 0) {
      lines.push('  (empty)');
    }

    lines.push('');

    if (model.showHelp) {
      lines.push(separator({ label: 'help', width: 50 }));
      lines.push(helpView(keys, { title: 'Keybindings' }));
    } else {
      lines.push(`  ${helpShort(keys)}`);
    }

    lines.push('');
    return lines.join('\n');
  },
};

run(app);

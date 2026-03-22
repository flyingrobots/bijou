import { initDefaultContext } from '@flyingrobots/bijou-node';
import { kbd, separator } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { badgeSurface, column, contentSurface, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

interface KeyEntry {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

interface Model {
  history: KeyEntry[];
}

type Msg = { type: 'quit' };

const MAX_HISTORY = 12;

const app: App<Model, Msg> = {
  init: () => [{ history: [] }, []],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.ctrl && msg.key === 'c') return [model, [quit()]];

      const entry: KeyEntry = { key: msg.key, ctrl: msg.ctrl, alt: msg.alt, shift: msg.shift };
      const history = [...model.history, entry].slice(-MAX_HISTORY);
      return [{ history }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const rows = [
      spacer(),
      line('  Key Event Inspector'),
      spacer(),
      contentSurface(`  ${separator({ label: 'press any key', width: 50 })}`),
      spacer(),
    ];

    if (model.history.length === 0) {
      rows.push(line('  Waiting for input...'));
    } else {
      for (const entry of model.history) {
        const parts: (string | ReturnType<typeof badgeSurface>)[] = ['  '];
        if (entry.ctrl) parts.push(badgeSurface('CTRL', 'warning', ctx), ' ');
        if (entry.alt) parts.push(badgeSurface('ALT', 'info', ctx), ' ');
        if (entry.shift) parts.push(badgeSurface('SHIFT', 'accent', ctx), ' ');
        parts.push(kbd(entry.key));
        rows.push(row(parts));
      }
    }

    rows.push(spacer());
    rows.push(line(`  ${kbd('Ctrl')}+${kbd('C')} to quit`));
    rows.push(spacer());

    return column(rows);
  },
};

run(app);

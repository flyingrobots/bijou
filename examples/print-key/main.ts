import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, kbd, separator, badge } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, type App } from '@flyingrobots/bijou-tui';

initDefaultContext();

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
    const lines: string[] = [
      '',
      '  Key Event Inspector',
      '',
      `  ${separator({ label: 'press any key', width: 50 })}`,
      '',
    ];

    if (model.history.length === 0) {
      lines.push('  Waiting for input...');
    } else {
      for (const entry of model.history) {
        const mods: string[] = [];
        if (entry.ctrl) mods.push(badge('CTRL', { variant: 'warning' }));
        if (entry.alt) mods.push(badge('ALT', { variant: 'info' }));
        if (entry.shift) mods.push(badge('SHIFT', { variant: 'accent' }));

        const modStr = mods.length > 0 ? mods.join(' ') + ' ' : '';
        lines.push(`  ${modStr}${kbd(entry.key)}`);
      }
    }

    lines.push('');
    lines.push(`  ${kbd('Ctrl')}+${kbd('C')} to quit`);
    lines.push('');

    return lines.join('\n');
  },
};

run(app);

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { kbd, separator, badge, surfaceToString } from '@flyingrobots/bijou';
import { run, quit, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { ansiContentSurface } from '../_shared/surface-bridge.ts';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

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
        if (entry.ctrl) mods.push(badgeText('CTRL', 'warning'));
        if (entry.alt) mods.push(badgeText('ALT', 'info'));
        if (entry.shift) mods.push(badgeText('SHIFT', 'accent'));

        const modStr = mods.length > 0 ? mods.join(' ') + ' ' : '';
        lines.push(`  ${modStr}${kbd(entry.key)}`);
      }
    }

    lines.push('');
    lines.push(`  ${kbd('Ctrl')}+${kbd('C')} to quit`);
    lines.push('');

    return ansiContentSurface(lines.join('\n'));
  },
};

run(app);

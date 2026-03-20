import { initDefaultContext } from '@flyingrobots/bijou-node';
import { progressBar, badge, surfaceToString } from '@flyingrobots/bijou';
import { run, quit, tick, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { ansiContentSurface } from '../_shared/surface-bridge.ts';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

interface Model {
  percent: number;
  done: boolean;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const app: App<Model, Msg> = {
  init: () => [
    { percent: 0, done: false },
    [tick(50, { type: 'tick' })],
  ],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
    }

    if ('type' in msg && msg.type === 'tick') {
      const next = Math.min(model.percent + 1, 100);
      if (next >= 100) {
        return [{ percent: 100, done: true }, [tick(1500, { type: 'quit' })]];
      }
      return [{ percent: next, done: false }, [tick(50, { type: 'tick' })]];
    }

    return [model, []];
  },

  view: (model) => {
    const lines = ['', '  Building project...', ''];

    if (model.done) {
      lines.push(`  ${progressBar(100, { width: 50, showPercent: true })}`);
      lines.push('');
      lines.push(`  ${badgeText('COMPLETE', 'success')}  Build finished.`);
    } else {
      lines.push(`  ${progressBar(model.percent, { width: 50, showPercent: true })}`);
    }

    lines.push('');
    return ansiContentSurface(lines.join('\n'));
  },
};

run(app);

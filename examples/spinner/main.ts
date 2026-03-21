import { initDefaultContext } from '@flyingrobots/bijou-node';
import { spinnerFrame } from '@flyingrobots/bijou';
import { run, quit, tick, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { badgeSurface, column, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

interface Model {
  frame: number;
  phase: 'loading' | 'processing' | 'done';
  elapsed: number;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const PHASE_DURATION = { loading: 30, processing: 20 };

const app: App<Model, Msg> = {
  init: () => [
    { frame: 0, phase: 'loading', elapsed: 0 },
    [tick(80, { type: 'tick' })],
  ],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
        return [model, [quit()]];
      }
    }

    if ('type' in msg && msg.type === 'tick') {
      const elapsed = model.elapsed + 1;

      if (model.phase === 'loading' && elapsed >= PHASE_DURATION.loading) {
        return [{ frame: model.frame + 1, phase: 'processing', elapsed: 0 }, [tick(80, { type: 'tick' })]];
      }
      if (model.phase === 'processing' && elapsed >= PHASE_DURATION.processing) {
        return [{ frame: model.frame + 1, phase: 'done', elapsed: 0 }, [tick(1000, { type: 'quit' })]];
      }

      return [{ frame: model.frame + 1, phase: model.phase, elapsed }, [tick(80, { type: 'tick' })]];
    }

    return [model, []];
  },

  view: (model) => {
    if (model.phase === 'done') {
      return column([spacer(), row(['  ', badgeSurface('DONE', 'success', ctx), '  All tasks complete.']), spacer()]);
    }

    const label = model.phase === 'loading'
      ? 'Fetching dependencies...'
      : 'Processing modules...';

    return column([spacer(), line(`  ${spinnerFrame(model.frame, { label })}`), spacer()]);
  },
};

run(app);

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { spinnerFrame, badge } from '@flyingrobots/bijou';
import { run, quit, tick, isKeyMsg, type App } from '@flyingrobots/bijou-tui';

initDefaultContext();

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
      return `\n  ${badge('DONE', { variant: 'success' })}  All tasks complete.\n`;
    }

    const label = model.phase === 'loading'
      ? 'Fetching dependencies...'
      : 'Processing modules...';

    return `\n  ${spinnerFrame(model.frame, { label })}\n`;
  },
};

run(app);

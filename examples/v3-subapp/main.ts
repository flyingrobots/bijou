import { pathToFileURL } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface, createSurface, type Surface } from '@flyingrobots/bijou';
import {
  initSubApp,
  isKeyMsg,
  mount,
  quit,
  run,
  type App,
  type Cmd,
  vstackSurface,
  updateSubApp,
} from '@flyingrobots/bijou-tui';
import { centerSurface, line, spacer } from '../_shared/example-surfaces.ts';

export const ctx = initDefaultContext();

interface CounterModel {
  count: number;
}

type CounterMsg =
  | { type: 'inc' }
  | { type: 'dec' };

export const counterApp: App<CounterModel, CounterMsg> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'inc') return [{ count: model.count + 1 }, []];
    if (msg.type === 'dec') return [{ count: model.count - 1 }, []];
    return [model, []];
  },
  view: (model) => badge(`Count ${model.count}`, { variant: model.count >= 0 ? 'success' : 'error' }),
};

interface Model {
  left: CounterModel;
  right: CounterModel;
  status: string;
}

type Msg =
  | { type: 'left'; msg: CounterMsg }
  | { type: 'right'; msg: CounterMsg };

function mapLeft(msg: CounterMsg): Msg {
  return { type: 'left', msg };
}

function mapRight(msg: CounterMsg): Msg {
  return { type: 'right', msg };
}

export const app: App<Model, Msg> = {
  init() {
    const [left, leftCmds] = initSubApp(counterApp, { onMsg: mapLeft });
    const [right, rightCmds] = initSubApp(counterApp, { onMsg: mapRight });
    return [
      { left, right, status: 'Ready' },
      [...leftCmds, ...rightCmds],
    ];
  },

  update(msg, model) {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
      if (msg.key === 'a') return updateLeft(model, { type: 'inc' }, 'Left +1');
      if (msg.key === 'z') return updateLeft(model, { type: 'dec' }, 'Left -1');
      if (msg.key === 'k') return updateRight(model, { type: 'inc' }, 'Right +1');
      if (msg.key === 'm') return updateRight(model, { type: 'dec' }, 'Right -1');
      return [model, []];
    }

    if (msg.type === 'left') return updateLeft(model, msg.msg, 'Left child command');
    if (msg.type === 'right') return updateRight(model, msg.msg, 'Right child command');
    return [model, []];
  },

  view: (model) => {
    const [leftView] = mount(counterApp, { model: model.left, onMsg: mapLeft });
    const [rightView] = mount(counterApp, { model: model.right, onMsg: mapRight });

    const dashboard = boxSurface(
      vstackSurface(
        row('Left Counter', ensureSurface(leftView)),
        spacer(1, 1),
        row('Right Counter', ensureSurface(rightView)),
        spacer(1, 1),
        line('Controls: [a/z] left  [k/m] right  [q] quit'),
        line(`Status: ${model.status}`),
      ),
      { title: 'Fractal TEA', padding: { top: 1, bottom: 1, left: 2, right: 2 } },
    );

    return centerSurface(ctx, dashboard);
  },
};

function updateLeft(model: Model, msg: CounterMsg, status: string): [Model, Cmd<Msg>[]] {
  const [left, cmds] = updateSubApp(counterApp, msg, model.left, { onMsg: mapLeft });
  return [{ ...model, left, status }, cmds];
}

function updateRight(model: Model, msg: CounterMsg, status: string): [Model, Cmd<Msg>[]] {
  const [right, cmds] = updateSubApp(counterApp, msg, model.right, { onMsg: mapRight });
  return [{ ...model, right, status }, cmds];
}

function row(label: string, content: Surface): Surface {
  const surface = createSurface(Math.max(36, content.width + 16), Math.max(3, content.height + 2));
  surface.blit(line(label), 0, 0);
  surface.blit(content, 0, 2);
  return surface;
}

function ensureSurface(view: Surface | string | { cells?: unknown }): Surface {
  if (typeof view === 'string' || !('cells' in view)) {
    throw new Error('v3-subapp expects child views to be surface-native');
  }
  return view;
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(app);
}

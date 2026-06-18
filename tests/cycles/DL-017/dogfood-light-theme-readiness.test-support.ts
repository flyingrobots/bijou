import type { App, Cmd, CmdCapabilities, KeyMsg } from '../../../packages/bijou-tui/src/types.js';
import { isCmdCleanup, QUIT } from '../../../packages/bijou-tui/src/types.js';

type TestCommandCapabilities = CmdCapabilities & {
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
};

export async function runKeysDeterministically<Model, Msg>(
  app: App<Model, Msg>,
  keys: readonly KeyMsg[],
): Promise<Model> {
  let nowMs = 0;
  const caps: TestCommandCapabilities = {
    now: () => nowMs,
    sleep: (ms) => {
      nowMs += Math.max(0, Math.floor(ms));
      return Promise.resolve();
    },
    onPulse: () => {
      throw new Error('runKeysDeterministically does not support pulse commands');
    },
  };

  let [model, commands] = app.init();
  model = await drainCommands(app, model, commands, caps);
  for (const key of keys) {
    [model, commands] = app.update(key, model);
    model = await drainCommands(app, model, commands, caps);
  }
  return model;
}

async function drainCommands<Model, Msg>(
  app: App<Model, Msg>,
  model: Model,
  commands: readonly Cmd<Msg>[],
  caps: TestCommandCapabilities,
): Promise<Model> {
  let pending = [...commands];
  for (let iterations = 0; pending.length > 0; iterations += 1) {
    if (iterations >= 100) throw new Error('Command drain exceeded 100 iterations');
    const batch = pending;
    pending = [];
    for (const command of batch) {
      const emitted: Msg[] = [];
      const result = await command((msg) => { emitted.push(msg); }, caps);
      if (result === QUIT) throw new Error('Unexpected quit command');
      if (!isCmdCleanup(result) && result !== undefined) emitted.push(result);
      for (const msg of emitted) {
        const [nextModel, nextCommands] = app.update(msg, model);
        model = nextModel;
        pending.push(...nextCommands);
      }
    }
  }
  return model;
}

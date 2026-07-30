import {
  resolveClock,
  type Surface,
} from '@flyingrobots/bijou';
import { createEventBus, type BusMsg } from './eventbus.js';
import { installBCSSResolver } from './css/install.js';
import { isResizeMsg } from './types.js';
import type {
  HarnessState,
  MutableCommandRecord,
  TestHarness,
  TestRuntimeOptions,
  TestRuntimeSnapshot,
} from './driver-contract.js';
import { createHarnessApi } from './driver-harness-api.js';
import { observeCommand } from './driver-harness-command.js';
import {
  captureSnapshot,
  teardownHarness,
} from './driver-harness-state.js';
import {
  createDriverRuntimeState,
  initialSize,
} from './driver-runtime.js';
import type { App } from './types.js';

/**
 * Start a TEA app inside an inspectable deterministic test harness.
 *
 * The harness renders the initial frame, settles init commands, and then lets
 * callers feed steps while inspecting snapshots, messages, command outcomes,
 * and cleanup disposal.
 */
export async function testRuntime<Model, M>(
  app: App<Model, M>,
  options?: TestRuntimeOptions,
): Promise<TestHarness<Model, M>> {
  const clock = resolveClock(options?.ctx);
  const bus = createEventBus<M>({ clock });
  const frames: Surface[] = [];
  const snapshots: TestRuntimeSnapshot<Model, M>[] = [];
  const messages: BusMsg<M>[] = [];
  const emittedMessages: M[] = [];
  const commands: MutableCommandRecord<M>[] = [];
  if (options?.ctx != null) {
    installBCSSResolver(options.ctx, options.css);
  }
  if (options?.pulseFps !== false) {
    bus.startPulse(
      options?.pulseFps ?? options?.ctx?.runtime.refreshRate ?? 60,
    );
  }
  const [initialModel, initialCommands] = (() => {
    try {
      return app.init();
    } catch (error) {
      bus.stopPulse();
      bus.dispose();
      throw error;
    }
  })();
  const state: HarnessState<Model, M> = {
    app,
    options,
    bus,
    clock,
    start: clock.now(),
    runtime: createDriverRuntimeState(),
    frames,
    snapshots,
    messages,
    emittedMessages,
    commands,
    model: initialModel,
    currentSize: initialSize(options?.ctx),
    nextCommandId: 0,
  };
  bus.onQuit(() => {
    state.runtime.running = false;
  });
  bus.on((msg) => {
    if (!state.runtime.running) return;
    state.messages.push(msg);
    const [model, commands] = app.update(msg, state.model);
    state.model = model;
    if (isResizeMsg(msg)) {
      state.currentSize = {
        width: Math.max(0, msg.columns),
        height: Math.max(0, msg.rows),
      };
    }
    captureSnapshot(state, 'update', msg);
    const triggerIndex = state.messages.length - 1;
    for (const command of commands) {
      bus.runCmd(observeCommand(state, command, 'update', triggerIndex));
    }
  });
  try {
    captureSnapshot(state, 'init');
    for (const command of initialCommands) {
      bus.runCmd(observeCommand(state, command, 'init', null));
    }
    await bus.drain();
  } catch (error) {
    await teardownHarness(state);
    throw error;
  }
  return createHarnessApi(state);
}

import type { IOPort } from '@flyingrobots/bijou';
import type { ResizeMsg } from './types.js';
import { parseRawInputMessages } from './input-parser.js';
import type { EventBusDisposable } from './eventbus-contract.js';
import type { EventBusState } from './eventbus-state.js';
import { emitMessage } from './eventbus-state.js';

export function connectEventBusIO<M>(
  state: EventBusState<M>,
  io: IOPort,
  mouseEnabled: boolean,
): EventBusDisposable {
  const inputHandle = io.rawInput((raw: string) => {
    if (state.disposed) return;
    for (const msg of parseRawInputMessages(raw, mouseEnabled)) {
      emitMessage(state, msg);
    }
  });
  const resizeHandle = io.onResize((columns, rows) => {
    if (state.disposed) return;
    const msg: ResizeMsg = { type: 'resize', columns, rows };
    emitMessage(state, msg);
  });
  const dataHandle = io.onData?.((payload) => {
    if (!state.disposed) Reflect.apply(emitMessage, undefined, [state, payload]);
  });
  const handle: EventBusDisposable = {
    dispose() {
      inputHandle.dispose();
      resizeHandle.dispose();
      dataHandle?.dispose();
    },
  };
  state.disposables.push(handle);
  return handle;
}

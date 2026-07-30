import {
  isCmdCleanup,
  QUIT,
  type Cmd,
} from './types.js';
import type {
  HarnessState,
  MutableCommandRecord,
} from './driver-contract.js';

/** Wrap a command with observable settlement and cleanup facts. */
export function observeCommand<Model, M>(
  state: HarnessState<Model, M>,
  cmd: Cmd<M>,
  source: 'init' | 'update',
  triggerIndex: number | null,
): Cmd<M> {
  const record: MutableCommandRecord<M> = {
    id: state.nextCommandId++,
    source,
    triggerIndex,
    emitted: [],
    resolution: 'pending',
    cleanedUp: false,
    settled: false,
  };
  state.commands.push(record);
  return async (emit, caps) => {
    const trackedEmit = (msg: M): void => {
      record.emitted.push(msg);
      state.emittedMessages.push(msg);
      emit(msg);
    };
    try {
      const result = await cmd(trackedEmit, caps);
      record.settled = true;
      if (isCmdCleanup(result)) {
        record.resolution = 'cleanup';
        record.result = result;
        if (typeof result === 'function') {
          return () => {
            record.cleanedUp = true;
            result();
          };
        }
        return {
          dispose() {
            record.cleanedUp = true;
            result.dispose();
          },
        };
      }
      if (result === QUIT) {
        record.resolution = 'quit';
        return result;
      }
      if (result !== undefined) {
        record.resolution = 'message';
        record.result = result;
        state.emittedMessages.push(result);
        return result;
      }
      record.resolution = 'void';
      return undefined;
    } catch (error) {
      record.settled = true;
      record.resolution = 'rejected';
      record.result = error;
      throw error;
    }
  };
}

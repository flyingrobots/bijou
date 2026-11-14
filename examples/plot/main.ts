import { initDefaultContext } from '@flyingrobots/bijou-node';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  isKeyMsg,
  isPulseMsg,
  isResizeMsg,
  quit,
  run,
  type App,
} from '@flyingrobots/bijou-tui';
import { createInitialTelemetry, stepTelemetry } from './btop-telemetry.js';
import type { PaletteName, ProcSortKey, VizModel } from './btop-types.js';
import { renderDashboardSurface } from './plot-scene.js';

const stdout: { columns?: number; rows?: number; isTTY?: boolean } = process.stdout;
const onceMode = process.argv.includes('--once') || !stdout.isTTY;

const PALETTES: readonly PaletteName[] = ['inferno', 'viridis', 'plasma', 'cool'];
const SORT_KEYS: readonly ProcSortKey[] = ['cpu', 'mem', 'pid'];

function createInitialModel(): VizModel {
  const telemetry = createInitialTelemetry();
  return {
    frame: 0,
    elapsedSec: 0,
    paused: false,
    cursorIdx: telemetry.historyLen - 1,
    selectedProcIdx: 0,
    sortKey: 'cpu',
    palette: 'inferno',
    sampleIntervalSec: 0.15,
    cols: stdout.columns ?? 114,
    rows: stdout.rows ?? 30,
    telemetry,
  };
}

if (onceMode) {
  const ctx = createTestContext({ mode: 'interactive' });
  const surface = renderDashboardSurface(createInitialModel(), ctx);
  console.log(surfaceToString(surface, ctx.style));
} else {
  const ctx = initDefaultContext();
  const app: App<VizModel> = {
    init: () => [createInitialModel(), []],
    update: (msg, model) => {
      if (isKeyMsg(msg)) {
        if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) {
          return [model, [quit()]];
        }
        if (msg.key === ' ' || msg.key === 'space') {
          return [{ ...model, paused: !model.paused }, []];
        }
        if (msg.key === 'up' || msg.key === 'k') {
          return [{ ...model, selectedProcIdx: Math.max(0, model.selectedProcIdx - 1) }, []];
        }
        if (msg.key === 'down' || msg.key === 'j') {
          const maxIdx = Math.max(0, model.telemetry.processes.length - 1);
          return [{ ...model, selectedProcIdx: Math.min(maxIdx, model.selectedProcIdx + 1) }, []];
        }
        if (msg.key === 's') {
          const nextIdx = (SORT_KEYS.indexOf(model.sortKey) + 1) % SORT_KEYS.length;
          return [{ ...model, sortKey: SORT_KEYS[nextIdx] ?? 'cpu', selectedProcIdx: 0 }, []];
        }
        if (msg.key === 'c') return [{ ...model, sortKey: 'cpu', selectedProcIdx: 0 }, []];
        if (msg.key === 'm') return [{ ...model, sortKey: 'mem', selectedProcIdx: 0 }, []];
        if (msg.key === 'p') return [{ ...model, sortKey: 'pid', selectedProcIdx: 0 }, []];
        if (msg.key === 'left' || msg.key === 'h') {
          return [{ ...model, cursorIdx: Math.max(0, model.cursorIdx - 1) }, []];
        }
        if (msg.key === 'right' || msg.key === 'l') {
          return [{ ...model, cursorIdx: Math.min(model.telemetry.historyLen - 1, model.cursorIdx + 1) }, []];
        }
        if (msg.key === '+' || msg.key === '=') {
          return [{ ...model, sampleIntervalSec: Math.max(0.05, Number((model.sampleIntervalSec - 0.05).toFixed(2))) }, []];
        }
        if (msg.key === '-' || msg.key === '_') {
          return [{ ...model, sampleIntervalSec: Math.min(1.0, Number((model.sampleIntervalSec + 0.05).toFixed(2))) }, []];
        }
        if (msg.key === '1' || msg.key === '2' || msg.key === '3' || msg.key === '4') {
          const p = PALETTES[Number(msg.key) - 1] ?? 'inferno';
          return [{ ...model, palette: p }, []];
        }
        return [model, []];
      }
      if (isResizeMsg(msg)) {
        return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
      }
      if (isPulseMsg(msg) && !model.paused) {
        stepTelemetry(model.telemetry, msg.dt, model.sampleIntervalSec);
        return [
          {
            ...model,
            frame: model.frame + 1,
            elapsedSec: model.elapsedSec + msg.dt,
          },
          [],
        ];
      }
      return [model, []];
    },
    view: (model) => renderDashboardSurface(model, ctx),
  };

  await run(app);
}

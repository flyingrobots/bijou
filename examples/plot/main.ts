import { initDefaultContext } from '@flyingrobots/bijou-node';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { isKeyMsg, isPulseMsg, isResizeMsg, quit, run, type App } from '@flyingrobots/bijou-tui';
import { sortProcesses } from './btop-panes.js';
import { createInitialTelemetry, stepTelemetry, togglePinnedPid } from './btop-telemetry.js';
import type { PaletteName, ProcSortKey, ViewMode, VizModel } from './btop-types.js';
import { getActiveFlameFrames } from './flame-scene.js';
import { createWorkspaceForceSim } from './force-scene.js';
import { renderDashboardSurface } from './plot-scene.js';
import { createInitialWaterfall, stepWaterfall } from './scope-scene.js';

const stdout: { columns?: number; rows?: number; isTTY?: boolean } = process.stdout;
const onceMode = process.argv.includes('--once') || !stdout.isTTY;
const PALETTES: readonly PaletteName[] = ['inferno', 'viridis', 'plasma', 'cool'];
const SORT_KEYS: readonly ProcSortKey[] = ['cpu', 'mem', 'pid'];
const VIEW_MODES: readonly ViewMode[] = ['btop', 'scope', 'force', 'flame'];

function resolveInitialView(): ViewMode {
  for (const arg of process.argv) {
    if (arg === '--view=scope' || arg === '--scope') return 'scope';
    if (arg === '--view=force' || arg === '--force') return 'force';
    if (arg === '--view=flame' || arg === '--flame') return 'flame';
  }
  return 'btop';
}

function createInitialModel(): VizModel {
  const telemetry = createInitialTelemetry();
  return {
    viewMode: resolveInitialView(), frame: 0, elapsedSec: 0, paused: false,
    cursorIdx: telemetry.historyLen - 1, selectedProcIdx: 0, sortKey: 'cpu', palette: 'inferno',
    sampleIntervalSec: 0.15, cols: stdout.columns ?? 114, rows: stdout.rows ?? 30, telemetry,
    waterfall: createInitialWaterfall(56, 13), forceSim: createWorkspaceForceSim(),
    selectedNodeIdx: 0, flameZoomId: 'root', selectedFlameIdx: 0,
  };
}

function handleEnterKey(model: VizModel): VizModel {
  if (model.viewMode === 'btop') {
    const sorted = sortProcesses(model.telemetry.processes, model.sortKey);
    togglePinnedPid(model.telemetry, sorted[model.selectedProcIdx]);
    return { ...model };
  }
  if (model.viewMode === 'force') {
    const node = model.forceSim.nodes()[model.selectedNodeIdx];
    if (node) model.forceSim.nudgeNode(node.id, 0, 0, !node.pinned);
    model.forceSim.reheat(0.85);
    return { ...model };
  }
  if (model.viewMode === 'flame') {
    const { frames } = getActiveFlameFrames(model.flameZoomId);
    const target = frames[model.selectedFlameIdx];
    return target ? { ...model, flameZoomId: target.id, selectedFlameIdx: 0 } : model;
  }
  return model;
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
        if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
        if (msg.key === 'tab') {
          const next = VIEW_MODES[(VIEW_MODES.indexOf(model.viewMode) + 1) % VIEW_MODES.length] ?? 'btop';
          return [{ ...model, viewMode: next }, []];
        }
        if (msg.key === ' ' || msg.key === 'space') return [{ ...model, paused: !model.paused }, []];
        if (msg.key === 'enter' || msg.key === 'return') return [handleEnterKey(model), []];
        if (msg.key === 'u' || msg.key === 'backspace') return [{ ...model, flameZoomId: 'root', selectedFlameIdx: 0 }, []];
        if (msg.key === 'up' || msg.key === 'k') {
          return [{
            ...model,
            selectedProcIdx: Math.max(0, model.selectedProcIdx - 1),
            selectedNodeIdx: Math.max(0, model.selectedNodeIdx - 1),
            selectedFlameIdx: Math.max(0, model.selectedFlameIdx - 1),
          }, []];
        }
        if (msg.key === 'down' || msg.key === 'j') {
          const maxP = Math.max(0, model.telemetry.processes.length - 1);
          const maxN = Math.max(0, model.forceSim.nodes().length - 1);
          const maxF = Math.max(0, getActiveFlameFrames(model.flameZoomId).frames.length - 1);
          return [{
            ...model,
            selectedProcIdx: Math.min(maxP, model.selectedProcIdx + 1),
            selectedNodeIdx: Math.min(maxN, model.selectedNodeIdx + 1),
            selectedFlameIdx: Math.min(maxF, model.selectedFlameIdx + 1),
          }, []];
        }
        if (msg.key === 's') {
          const nextSort = SORT_KEYS[(SORT_KEYS.indexOf(model.sortKey) + 1) % SORT_KEYS.length] ?? 'cpu';
          return [{ ...model, sortKey: nextSort, selectedProcIdx: 0 }, []];
        }
        if (msg.key === 'left' || msg.key === 'h') {
          const node = model.forceSim.nodes()[model.selectedNodeIdx];
          if (model.viewMode === 'force' && node) model.forceSim.nudgeNode(node.id, -0.04, 0);
          return [{ ...model, cursorIdx: Math.max(0, model.cursorIdx - 1) }, []];
        }
        if (msg.key === 'right' || msg.key === 'l') {
          const node = model.forceSim.nodes()[model.selectedNodeIdx];
          if (model.viewMode === 'force' && node) model.forceSim.nudgeNode(node.id, 0.04, 0);
          return [{ ...model, cursorIdx: Math.min(model.telemetry.historyLen - 1, model.cursorIdx + 1) }, []];
        }
        if (msg.key === '+' || msg.key === '=') {
          return [{ ...model, sampleIntervalSec: Math.max(0.05, Number((model.sampleIntervalSec - 0.05).toFixed(2))) }, []];
        }
        if (msg.key === '-' || msg.key === '_') {
          return [{ ...model, sampleIntervalSec: Math.min(1.0, Number((model.sampleIntervalSec + 0.05).toFixed(2))) }, []];
        }
        if (msg.key === '1' || msg.key === '2' || msg.key === '3' || msg.key === '4') {
          return [{ ...model, palette: PALETTES[Number(msg.key) - 1] ?? 'inferno' }, []];
        }
        return [model, []];
      }
      if (isResizeMsg(msg)) return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
      if (isPulseMsg(msg) && !model.paused) {
        stepTelemetry(model.telemetry, msg.dt, model.sampleIntervalSec);
        if (model.frame % 4 === 0) stepWaterfall(model.waterfall, model.elapsedSec * 2.4, model.palette);
        if (model.viewMode === 'force') model.forceSim.tick(1);
        return [{ ...model, frame: model.frame + 1, elapsedSec: model.elapsedSec + msg.dt }, []];
      }
      return [model, []];
    },
    view: (model) => renderDashboardSurface(model, ctx),
  };
  await run(app);
}

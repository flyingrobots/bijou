import {
  createBijou,
  setDefaultContext,
} from '../../packages/bijou/src/index.js';
import {
  chalkStyle,
  nodeIO,
  nodeRuntime,
} from '../../packages/bijou-node/src/index.js';

const TERM = 'TERM';
const COLORTERM = 'COLORTERM';

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createCaptureContext() {
  const baseRuntime = nodeRuntime();
  const baseIO = nodeIO();
  const columns = readIntEnv(
    'DOGFOOD_CAPTURE_COLUMNS',
    readIntEnv('COLUMNS', 160),
  );
  const rows = readIntEnv('DOGFOOD_CAPTURE_ROWS', readIntEnv('LINES', 44));

  const runtime = {
    env(key: string): string | undefined {
      if (key === TERM) {
        return process.env[TERM] && process.env[TERM] !== 'dumb'
          ? process.env[TERM]
          : 'xterm-256color';
      }
      if (key === COLORTERM) return process.env[COLORTERM] ?? 'truecolor';
      if (key === 'CI' || key === 'NO_COLOR' || key === 'BIJOU_ACCESSIBLE') {
        return undefined;
      }
      return baseRuntime.env(key);
    },
    get stdoutIsTTY(): boolean {
      return true;
    },
    get stdinIsTTY(): boolean {
      return true;
    },
    get columns(): number {
      return columns;
    },
    get rows(): number {
      return rows;
    },
    get refreshRate(): number {
      return baseRuntime.refreshRate;
    },
  };

  const io = {
    ...baseIO,
    rawInput() {
      return {
        dispose: () => undefined,
      };
    },
  };

  const context = createBijou({
    runtime,
    io,
    style: chalkStyle({ noColor: false, level: 3 }),
  });
  setDefaultContext(context);
  return context;
}

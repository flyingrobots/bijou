import {
  createBijou,
  setDefaultContext,
} from '../../packages/bijou/src/index.js';
import {
  chalkStyle,
  nodeIO,
  nodeRuntime,
} from '../../packages/bijou-node/src/index.js';

export interface CaptureContextOptions {
  readonly captureColumns?: string;
  readonly captureRows?: string;
  readonly columns?: string;
  readonly rows?: string;
  readonly environment: Readonly<Record<string, string | undefined>>;
}

function readIntEnv(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createCaptureContext(options: CaptureContextOptions) {
  const baseRuntime = nodeRuntime();
  const baseIO = nodeIO();
  const columns = readIntEnv(
    options.captureColumns,
    readIntEnv(options.columns, 160),
  );
  const rows = readIntEnv(options.captureRows, readIntEnv(options.rows, 44));

  const runtime = {
    env(key: string): string | undefined {
      if (Object.hasOwn(options.environment, key)) {
        return options.environment[key];
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

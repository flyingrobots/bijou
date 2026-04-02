import { createBijou, setDefaultContext } from '../../packages/bijou/src/index.js';
import { chalkStyle, nodeIO, nodeRuntime } from '../../packages/bijou-node/src/index.js';
import { run, type App, type Cmd, type KeyMsg } from '../../packages/bijou-tui/src/index.js';
import { createDocsApp } from './app.js';

type InnerApp = ReturnType<typeof createDocsApp>;
type CaptureModel = ReturnType<InnerApp['init']>[0];
type CaptureMsg = Parameters<InnerApp['update']>[0];
type CaptureRoute = 'landing' | 'docs';
type CaptureScenarioName = 'landing' | 'docs';

type WalkthroughStep = {
  readonly delayMs: number;
  readonly key: string;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly shift?: boolean;
};

type CaptureScenario = {
  readonly initialRoute: CaptureRoute;
  readonly pace: number;
  readonly steps: readonly WalkthroughStep[];
};

const CAPTURE_SCENARIOS: Record<CaptureScenarioName, CaptureScenario> = {
  landing: {
    initialRoute: 'landing',
    pace: 1,
    steps: [
      { delayMs: 6500, key: 'q' },
      { delayMs: 700, key: 'y' },
    ],
  },
  docs: {
    initialRoute: 'docs',
    pace: 1.05,
    steps: [
      { delayMs: 1200, key: 'enter' },
      { delayMs: 700, key: 'down' },
      { delayMs: 450, key: 'enter' },
      { delayMs: 1400, key: '2' },
      { delayMs: 900, key: '4' },
      { delayMs: 1000, key: 'f2' },
      { delayMs: 1100, key: 'down' },
      { delayMs: 450, key: 'enter' },
      { delayMs: 1500, key: 'escape' },
      { delayMs: 800, key: '/' },
      { delayMs: 250, key: 'm' },
      { delayMs: 160, key: 'o' },
      { delayMs: 160, key: 'd' },
      { delayMs: 160, key: 'a' },
      { delayMs: 160, key: 'l' },
      { delayMs: 400, key: 'enter' },
      { delayMs: 1800, key: 'q' },
      { delayMs: 700, key: 'y' },
    ],
  },
};

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readScenarioEnv(): CaptureScenarioName {
  const raw = process.env['DOGFOOD_CAPTURE_SCENARIO'];
  return raw === 'docs' ? 'docs' : 'landing';
}

function keyMsg(step: WalkthroughStep): KeyMsg {
  return {
    type: 'key',
    key: step.key,
    ctrl: step.ctrl ?? false,
    alt: step.alt ?? false,
    shift: step.shift ?? false,
  };
}

function widenCmd<M>(cmd: Cmd<any>): Cmd<M> {
  return async (emit, capabilities) => {
    const result = await cmd((msg: any) => emit(msg as M), capabilities);
    return result as any;
  };
}

function autoplayCmd(scenario: CaptureScenario): Cmd<CaptureMsg> {
  return async (emit, capabilities) => {
    const sleep = capabilities.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const pace = readNumberEnv('DOGFOOD_CAPTURE_PACE', scenario.pace);
    for (const step of scenario.steps) {
      const delayMs = Math.max(0, Math.round(step.delayMs * pace));
      if (delayMs > 0) {
        await sleep(delayMs);
      }
      emit(keyMsg(step) as CaptureMsg);
    }
  };
}

function createCaptureApp(
  ctx: ReturnType<typeof createCaptureContext>,
  scenario: CaptureScenario,
): App<CaptureModel, CaptureMsg> {
  const inner = createDocsApp(ctx, { initialRoute: scenario.initialRoute });
  return {
    init() {
      const [model, cmds] = inner.init();
      return [model, [...cmds.map((cmd) => widenCmd<CaptureMsg>(cmd)), autoplayCmd(scenario)]];
    },
    update(msg, model) {
      if (scenario.initialRoute === 'landing' && msg.type === 'pulse') {
        return [model, []];
      }
      return inner.update(msg as any, model as any) as any;
    },
    view(model) {
      return inner.view(model as any);
    },
    routeRuntimeIssue(issue) {
      return inner.routeRuntimeIssue?.(issue) as CaptureMsg | undefined;
    },
  };
}

function createCaptureContext() {
  const baseRuntime = nodeRuntime();
  const baseIO = nodeIO();
  const columns = readIntEnv('DOGFOOD_CAPTURE_COLUMNS', readIntEnv('COLUMNS', 160));
  const rows = readIntEnv('DOGFOOD_CAPTURE_ROWS', readIntEnv('LINES', 44));

  const runtime = {
    env(key: string): string | undefined {
      if (key === 'TERM') {
        return process.env['TERM'] && process.env['TERM'] !== 'dumb'
          ? process.env['TERM']
          : 'xterm-256color';
      }
      if (key === 'COLORTERM') return process.env['COLORTERM'] ?? 'truecolor';
      if (key === 'CI' || key === 'NO_COLOR' || key === 'BIJOU_ACCESSIBLE') return undefined;
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
        dispose() {},
      };
    },
  };

  const ctx = createBijou({
    runtime,
    io,
    style: chalkStyle({ noColor: false, level: 3 }),
  });
  setDefaultContext(ctx);
  return ctx;
}

const scenario = CAPTURE_SCENARIOS[readScenarioEnv()];
const ctx = createCaptureContext();
await run(createCaptureApp(ctx, scenario), { ctx, mouse: false });

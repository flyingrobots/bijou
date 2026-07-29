import {
  run,
  type App,
  type Cmd,
  type KeyMsg,
} from '../../packages/bijou-tui/src/index.js';
import { createDocsApp } from './app.js';
import { createCaptureContext } from './capture-context.js';

type InnerApp = ReturnType<typeof createDocsApp>;
type CaptureModel = ReturnType<InnerApp['init']>[0];
type CaptureMsg = Parameters<InnerApp['update']>[0];
type CaptureRoute = 'landing' | 'docs';
type CaptureScenarioName = 'landing' | 'docs';

const LANDING: CaptureScenarioName = 'landing';
const DOCS: CaptureScenarioName = 'docs';
interface WalkthroughStep {
  readonly delayMs: number;
  readonly key: string;
  readonly ctrl?: boolean;
  readonly alt?: boolean;
  readonly shift?: boolean;
}

interface CaptureScenario {
  readonly initialRoute: CaptureRoute;
  readonly pace: number;
  readonly steps: readonly WalkthroughStep[];
}

const CAPTURE_SCENARIOS: Record<CaptureScenarioName, CaptureScenario> = {
  landing: {
    initialRoute: LANDING,
    pace: 1,
    steps: [
      { delayMs: 6500, key: 'q' },
      { delayMs: 700, key: 'y' },
    ],
  },
  docs: {
    initialRoute: DOCS,
    pace: 1.05,
    steps: [
      { delayMs: 700, key: ']' },
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

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readScenarioEnv(): CaptureScenarioName {
  const raw = process.env['DOGFOOD_CAPTURE_SCENARIO'];
  return raw === DOCS ? DOCS : LANDING;
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

function autoplayCmd(scenario: CaptureScenario): Cmd<CaptureMsg> {
  return async (emit, capabilities) => {
    const sleep =
      capabilities.sleep?.bind(capabilities) ??
      ((ms: number) =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, ms);
        }));
    const pace = readNumberEnv('DOGFOOD_CAPTURE_PACE', scenario.pace);
    for (const step of scenario.steps) {
      const delayMs = Math.max(0, Math.round(step.delayMs * pace));
      if (delayMs > 0) await sleep(delayMs);
      emit(keyMsg(step));
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
      return [model, [...cmds, autoplayCmd(scenario)]];
    },
    update(msg, model) {
      if (scenario.initialRoute === LANDING && msg.type === 'pulse') {
        return [model, []];
      }
      return inner.update(msg, model);
    },
    view(model) {
      return inner.view(model);
    },
    routeRuntimeIssue(issue) {
      return inner.routeRuntimeIssue?.(issue);
    },
  };
}

const scenario = CAPTURE_SCENARIOS[readScenarioEnv()];
const term = process.env.TERM;
const ctx = createCaptureContext({
  captureColumns: process.env.DOGFOOD_CAPTURE_COLUMNS,
  captureRows: process.env.DOGFOOD_CAPTURE_ROWS,
  columns: process.env.COLUMNS,
  rows: process.env.LINES,
  environment: {
    TERM: term != null && term !== 'dumb' ? term : 'xterm-256color',
    COLORTERM: process.env.COLORTERM ?? 'truecolor',
    CI: undefined,
    NO_COLOR: undefined,
    BIJOU_ACCESSIBLE: undefined,
  },
});
await run(createCaptureApp(ctx, scenario), { ctx, mouse: false });

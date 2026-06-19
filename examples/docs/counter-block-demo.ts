import {
  boxSurface,
  commandIntent,
  defineBlock,
  defineDataRequirement,
  defineViewData,
  graphemeWidth,
  progressBar,
  type BijouContext,
  type BlockDefinition,
  type BlockRenderInput,
  type BlockRenderResult,
  type OutputMode,
  type Surface,
} from '@flyingrobots/bijou';
import {
  isRuntimeCommandIntentEmission,
  runtimeCommandIntentEmission,
  type RuntimeCommandIntentEmission,
} from '@flyingrobots/bijou-tui';
import { contentSurface } from '../_shared/example-surfaces.js';

export const COUNTER_DEMO_MIN = 0;
export const COUNTER_DEMO_MAX = 10;

const COUNTER_DEMO_ANIMATION_MS = 480;
const COUNTER_DEMO_PACKAGE = '@flyingrobots/bijou-dogfood-fixtures';
const BLOCK_NAME = 'CounterDemoBlock';
const COUNTER_DEMO_MODES: readonly OutputMode[] = Object.freeze([
  'interactive',
  'static',
  'pipe',
  'accessible',
]);

export type CounterDemoIntentAction = 'decrement' | 'increment';

export interface CounterDemoIntentPayload {
  readonly delta: -1 | 1;
}

export interface CounterDemoModel {
  readonly counter: number;
  readonly previousCounter: number;
  readonly animationTimeMs: number;
  readonly lastIntentId?: string;
}

export interface CounterDemoBlockConfig {
  readonly counter: number;
  readonly previousCounter?: number;
  readonly animationTimeMs?: number;
  readonly width?: number;
  readonly ctx?: BijouContext;
}

export const counterDemoValueRequirement = defineDataRequirement({
  id: 'fixture.counter.value',
  resource: 'fixture.counter.value',
  label: 'Counter value',
  description: 'Bounded counter value used by the non-shipping counter block fixture.',
  facts: [{ kind: 'entity', key: 'block.fixture', value: BLOCK_NAME }],
});

export const counterDemoDataContract = defineViewData({
  id: 'fixture-counter-block.data',
  label: 'CounterDemoBlock data',
  description: 'Fixture data contract for the bounded counter value.',
  requirements: [
    { name: 'counter', requirement: counterDemoValueRequirement },
  ],
});

export const counterDemoDecrementIntent = commandIntent<CounterDemoIntentPayload>(
  'fixture.counter.decrement',
  {
    label: 'Decrease counter',
    description: 'Request the counter value to decrease by one.',
    facts: [{ kind: 'entity', key: 'block.command', value: BLOCK_NAME }],
  },
);

export const counterDemoIncrementIntent = commandIntent<CounterDemoIntentPayload>(
  'fixture.counter.increment',
  {
    label: 'Increase counter',
    description: 'Request the counter value to increase by one.',
    facts: [{ kind: 'entity', key: 'block.command', value: BLOCK_NAME }],
  },
);

export const counterDemoBlock: BlockDefinition<CounterDemoBlockConfig, string> = defineBlock({
  metadata: {
    packageName: COUNTER_DEMO_PACKAGE,
    blockName: BLOCK_NAME,
    family: 'fixture-blocks',
    scale: 'control',
    modes: COUNTER_DEMO_MODES,
    docs: {
      summary: 'Non-shipping DOGFOOD fixture block for proving bounded counter intents and mode lowering.',
      useWhen: ['Testing block previews, command intents, and lowering paths without shipping a catalog block.'],
      avoidWhen: ['A production app needs a reusable counter control. This fixture is intentionally DOGFOOD-only.'],
      relatedDocs: ['docs/design-system/blocks.md'],
    },
    sourcePath: 'examples/docs/counter-block-demo.ts',
    slots: [
      { id: 'counter', required: true, description: 'Bounded counter value from 0 to 10.' },
    ],
    variants: [
      {
        id: 'interactive',
        label: 'Interactive',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'interactive' }],
      },
      {
        id: 'static',
        label: 'Static',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'static' }],
      },
      {
        id: 'plain',
        label: 'Pipe / screenreader',
        requiredSlots: ['counter'],
        facts: [{ kind: 'state', key: 'fixture.mode', value: 'plain' }],
      },
    ],
    configOptions: [
      {
        id: 'counter',
        label: 'Counter',
        kind: 'number',
        required: true,
        description: 'Target counter value, clamped from 0 through 10.',
      },
    ],
    composedComponents: ['progressBar()', 'commandIntent()', 'BindingFrame'],
    semanticFacts: [
      { kind: 'entity', key: 'block', value: BLOCK_NAME },
      { kind: 'state', key: 'shipping', value: false },
    ],
    examples: [{ id: 'counter-block.dogfood', label: 'DOGFOOD Blocks preview' }],
    tags: ['fixture', 'counter', 'intent', 'lowering'],
  },
  data: counterDemoDataContract,
  commands: [
    counterDemoDecrementIntent,
    counterDemoIncrementIntent,
  ],
  render: renderCounterDemoBlock,
});

export function normalizeCounterValue(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return COUNTER_DEMO_MIN;
  return Math.max(COUNTER_DEMO_MIN, Math.min(COUNTER_DEMO_MAX, Math.round(numeric)));
}

export function createCounterDemoModel(counter = 5): CounterDemoModel {
  const normalized = normalizeCounterValue(counter);
  return Object.freeze({
    counter: normalized,
    previousCounter: normalized,
    animationTimeMs: COUNTER_DEMO_ANIMATION_MS,
  });
}

export function tickCounterDemoModel(model: CounterDemoModel, deltaMs: number): CounterDemoModel {
  const nextTime = Math.min(
    COUNTER_DEMO_ANIMATION_MS,
    Math.max(0, model.animationTimeMs + Math.max(0, Math.round(deltaMs))),
  );
  if (nextTime === model.animationTimeMs) return model;
  return Object.freeze({ ...model, animationTimeMs: nextTime });
}

export function counterDemoIntentForAction(
  action: CounterDemoIntentAction,
): RuntimeCommandIntentEmission<CounterDemoIntentPayload> {
  return runtimeCommandIntentEmission(
    action === 'decrement' ? counterDemoDecrementIntent : counterDemoIncrementIntent,
    { delta: action === 'decrement' ? -1 : 1 },
  );
}

export function counterDemoIntentForKey(
  key: string,
): RuntimeCommandIntentEmission<CounterDemoIntentPayload> | undefined {
  if (key === '-') return counterDemoIntentForAction('decrement');
  if (key === '+' || key === '=') return counterDemoIntentForAction('increment');
  return undefined;
}

export function applyCounterDemoIntent(
  model: CounterDemoModel,
  emission: RuntimeCommandIntentEmission<CounterDemoIntentPayload>,
): CounterDemoModel {
  const candidate: unknown = emission;
  if (!isRuntimeCommandIntentEmission(candidate)) {
    throw new Error('counter demo: intent emission must be created by runtimeCommandIntentEmission()');
  }
  const previousCounter = model.counter;
  const nextCounter = normalizeCounterValue(previousCounter + emission.payload.delta);
  return Object.freeze({
    counter: nextCounter,
    previousCounter,
    animationTimeMs: 0,
    lastIntentId: emission.intent.id,
  });
}

export function counterDemoBlockConfig(
  model: CounterDemoModel,
  ctx: BijouContext,
  width: number,
): CounterDemoBlockConfig {
  return {
    counter: model.counter,
    previousCounter: model.previousCounter,
    animationTimeMs: model.animationTimeMs,
    width,
    ctx,
  };
}

export function counterDemoBlockSurface(config: CounterDemoBlockConfig): Surface {
  const mode = normalizeCounterMode(config.ctx?.mode);
  const output = counterDemoBlock.render({ config, mode }).output;
  const lines = output.split('\n');
  return boxSurface(contentSurface(output), {
    title: mode === 'static' ? 'CounterDemoBlock static' : 'CounterDemoBlock fixture',
    width: Math.max(32, Math.min(72, config.width ?? widestLine(lines) + 4)),
    borderToken: config.ctx?.border('primary'),
    padding: { left: 1, right: 1 },
    ctx: config.ctx,
  });
}

export function counterDemoLoweringPreviewText(
  model: CounterDemoModel,
  width: number,
  ctx: BijouContext,
): string {
  const config = counterDemoBlockConfig(model, ctx, width);
  const interactiveOutput = counterDemoBlock.render({ config, mode: 'interactive' }).output;
  const staticOutput = counterDemoBlock.render({ config, mode: 'static' }).output;
  const pipeOutput = counterDemoBlock.render({ config, mode: 'pipe' }).output;
  const accessibleOutput = counterDemoBlock.render({ config, mode: 'accessible' }).output;
  return [
    `interactive: ${summarizeCounterOutput(interactiveOutput)}`,
    `static: ${summarizeCounterOutput(staticOutput)}`,
    `pipe: ${pipeOutput}`,
    `screenreader: ${accessibleOutput}`,
    `json: ${JSON.stringify(renderCounterDemoJson(model.counter))}`,
  ].join('\n');
}

export function counterDemoDocumentationText(): string {
  return [
    'CounterDemoBlock is a non-shipping fixture used by DOGFOOD.',
    'It proves that a block can expose visible controls as command intents while lowering to static, plain text, screenreader, and JSON outputs.',
    'The counter value is bounded from 0 to 10 and never mutates provider state directly.',
  ].join('\n');
}

export function renderCounterDemoJson(counter: unknown): Readonly<{ counter: number }> {
  return Object.freeze({ counter: normalizeCounterValue(counter) });
}

function renderCounterDemoBlock(
  input: BlockRenderInput<CounterDemoBlockConfig>,
): BlockRenderResult<string> {
  const mode = normalizeCounterMode(input.mode ?? input.config?.ctx?.mode);
  const counter = normalizeCounterValue(input.config?.counter ?? input.slots?.counter);
  const line = `Counter: ${String(counter)}`;

  if (mode === 'pipe' || mode === 'accessible') {
    return counterDemoResult(line, counter);
  }

  const previousCounter = normalizeCounterValue(input.config?.previousCounter ?? counter);
  const animationTimeMs = Math.max(0, Math.round(input.config?.animationTimeMs ?? COUNTER_DEMO_ANIMATION_MS));
  const animatedCounter = mode === 'interactive'
    ? interpolateCounter(previousCounter, counter, animationTimeMs)
    : counter;
  const percent = Math.round((animatedCounter / COUNTER_DEMO_MAX) * 100);
  const width = Math.max(28, Math.min(52, (input.config?.width ?? 52) - 18));
  const ctx = input.config?.ctx;
  const bar = ctx == null
    ? fallbackProgressBar(animatedCounter, width)
    : progressBar(percent, { width, showPercent: false, ctx });

  const lines = [bar, line];

  if (mode === 'interactive') {
    lines.push(
      '[-] decrease   [+] increase',
      'Intents: - fixture.counter.decrement | + fixture.counter.increment',
    );
  }

  return counterDemoResult(lines.join('\n'), counter);
}

function counterDemoResult(output: string, counter: number): BlockRenderResult<string> {
  return Object.freeze({
    output,
    facts: Object.freeze([
      Object.freeze({ kind: 'entity', key: 'block', value: 'CounterDemoBlock' }),
      Object.freeze({ kind: 'state', key: 'counter', value: counter }),
    ]),
  });
}

function interpolateCounter(previousCounter: number, counter: number, animationTimeMs: number): number {
  const t = Math.max(0, Math.min(1, animationTimeMs / COUNTER_DEMO_ANIMATION_MS));
  return previousCounter + (counter - previousCounter) * t;
}

function fallbackProgressBar(counter: number, width: number): string {
  const innerWidth = Math.max(1, width - 2);
  const filled = Math.max(0, Math.min(innerWidth, Math.round((counter / COUNTER_DEMO_MAX) * innerWidth)));
  return `[${'#'.repeat(filled)}${'.'.repeat(innerWidth - filled)}]`;
}

function normalizeCounterMode(mode: OutputMode | undefined): OutputMode {
  if (!mode || !COUNTER_DEMO_MODES.includes(mode)) return 'interactive';
  return mode;
}

function widestLine(lines: readonly string[]): number {
  return lines.reduce((width, value) => Math.max(width, graphemeWidth(value)), 1);
}

function summarizeCounterOutput(value: string): string {
  const lines = value
    .split('\n')
    .map((lineText) => lineText.trim())
    .filter(Boolean);
  const counterLine = lines.find((lineText) => lineText.startsWith('Counter: ')) ?? 'Counter: 0';
  const controls = lines.find((lineText) => lineText.includes('[-]') && lineText.includes('[+]'));
  return controls == null ? counterLine : `${counterLine}; controls: -/+`;
}

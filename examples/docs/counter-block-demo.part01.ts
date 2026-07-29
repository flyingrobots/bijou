import { commandIntent, defineDataRequirement, defineViewData, progressBar, type BijouContext, type BlockRenderInput, type BlockRenderResult, type OutputMode } from '@flyingrobots/bijou';

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

function normalizeCounterMode(mode: OutputMode | undefined): OutputMode {
  if (!mode || !COUNTER_DEMO_MODES.includes(mode)) return 'interactive';
  return mode;
}

export function normalizeCounterValue(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return COUNTER_DEMO_MIN;
  return Math.max(COUNTER_DEMO_MIN, Math.min(COUNTER_DEMO_MAX, Math.round(numeric)));
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

export { BLOCK_NAME, COUNTER_DEMO_ANIMATION_MS, COUNTER_DEMO_MODES, COUNTER_DEMO_PACKAGE, normalizeCounterMode, renderCounterDemoBlock };

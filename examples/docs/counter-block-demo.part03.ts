import { boxSurface, graphemeWidth, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { contentSurface } from '../_shared/example-surfaces.js';
import { dogfoodLocalizedText as dogfoodText } from './localization.js';
import { normalizeCounterMode, normalizeCounterValue } from './counter-block-demo.part01.js';
import type { CounterDemoBlockConfig, CounterDemoModel } from './counter-block-demo.part01.js';
import { counterDemoBlock } from './counter-block-demo.part02.js';

export function counterDemoBlockConfig(
  model: CounterDemoModel,
  ctx: BijouContext,
  width: number,
  localization?: CounterDemoBlockConfig['localization'],
): CounterDemoBlockConfig {
  return {
    counter: model.counter,
    previousCounter: model.previousCounter,
    animationTimeMs: model.animationTimeMs,
    width,
    ctx,
    localization,
  };
}

function widestLine(lines: readonly string[]): number {
  return lines.reduce((width, value) => Math.max(width, graphemeWidth(value)), 1);
}

export function counterDemoBlockSurface(config: CounterDemoBlockConfig): Surface {
  const mode = normalizeCounterMode(config.ctx?.mode);
  const output = counterDemoBlock.render({ config, mode }).output;
  const lines = output.split('\n');
  return boxSurface(contentSurface(output), {
    title: mode === 'static'
      ? dogfoodText(
        config.localization,
        'counterDemo.surfaceTitle.static',
        'CounterDemoBlock static',
      )
      : dogfoodText(
        config.localization,
        'counterDemo.surfaceTitle.fixture',
        'CounterDemoBlock fixture',
      ),
    width: Math.max(32, Math.min(72, config.width ?? widestLine(lines) + 4)),
    borderToken: config.ctx?.border('primary'),
    padding: { left: 1, right: 1 },
    ctx: config.ctx,
  });
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

export function renderCounterDemoJson(counter: unknown): Readonly<{ counter: number }> {
  return Object.freeze({ counter: normalizeCounterValue(counter) });
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

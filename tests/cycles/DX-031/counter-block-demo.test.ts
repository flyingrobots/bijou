import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  applyCounterDemoIntent,
  counterDemoBlock,
  counterDemoBlockSurface,
  counterDemoIntentForAction,
  counterDemoIntentForKey,
  createCounterDemoModel,
  renderCounterDemoJson,
} from '../../../examples/docs/counter-block-demo.js';
import { findComponentStory } from '../../../examples/docs/stories.js';

describe('DX-031F counter block fixture', () => {
  it('lowers the counter block by mode without leaking interactive controls into static/plain modes', () => {
    const interactive = counterDemoBlock.render({
      config: { counter: 7, previousCounter: 3, animationTimeMs: 200 },
      mode: 'interactive',
    }).output;
    const staticOutput = counterDemoBlock.render({
      config: { counter: 7 },
      mode: 'static',
    }).output;
    const pipe = counterDemoBlock.render({
      config: { counter: 7 },
      mode: 'pipe',
    }).output;
    const accessible = counterDemoBlock.render({
      config: { counter: 7 },
      mode: 'accessible',
    }).output;

    expect(interactive).toContain('Counter: 7');
    expect(interactive).toContain('[-]');
    expect(interactive).toContain('[+]');
    expect(interactive).toContain('fixture.counter.decrement');
    expect(interactive).toContain('fixture.counter.increment');
    expect(staticOutput).toContain('Counter: 7');
    expect(staticOutput).not.toContain('[-]');
    expect(staticOutput).not.toContain('[+]');
    expect(pipe).toBe('Counter: 7');
    expect(accessible).toBe('Counter: 7');
  });

  it('emits inspectable increment and decrement intents and applies them with 0-10 bounds', () => {
    const incremented = applyCounterDemoIntent(
      createCounterDemoModel(10),
      counterDemoIntentForAction('increment'),
    );
    const decremented = applyCounterDemoIntent(
      createCounterDemoModel(0),
      counterDemoIntentForAction('decrement'),
    );
    const plus = counterDemoIntentForKey('+');
    const equals = counterDemoIntentForKey('=');
    const minus = counterDemoIntentForKey('-');

    expect(incremented.counter).toBe(10);
    expect(incremented.previousCounter).toBe(10);
    expect(incremented.lastIntentId).toBe('fixture.counter.increment');
    expect(decremented.counter).toBe(0);
    expect(decremented.previousCounter).toBe(0);
    expect(decremented.lastIntentId).toBe('fixture.counter.decrement');
    expect(plus?.intent.id).toBe('fixture.counter.increment');
    expect(equals?.intent.id).toBe('fixture.counter.increment');
    expect(minus?.intent.id).toBe('fixture.counter.decrement');
    expect(counterDemoIntentForKey('x')).toBeUndefined();
  });

  it('emits increment intents through the same node/tsx module graph used by DOGFOOD', () => {
    const moduleUrl = new URL('../../../examples/docs/counter-block-demo.ts', import.meta.url);
    const output = execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '--eval',
        [
          `import { applyCounterDemoIntent, counterDemoIntentForAction, createCounterDemoModel } from ${JSON.stringify(moduleUrl.href)};`,
          'const next = applyCounterDemoIntent(createCounterDemoModel(5), counterDemoIntentForAction("increment"));',
          'process.stdout.write(JSON.stringify({ counter: next.counter, lastIntentId: next.lastIntentId }));',
        ].join('\n'),
      ],
      {
        cwd: new URL('../../../', import.meta.url),
        encoding: 'utf8',
      },
    );

    expect(JSON.parse(output)).toEqual({
      counter: 6,
      lastIntentId: 'fixture.counter.increment',
    });
  });

  it('renders a deterministic animated progress surface from the previous value to the target value', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80, rows: 24 } });
    const start = counterDemoBlockSurface({
      counter: 10,
      previousCounter: 0,
      animationTimeMs: 0,
      width: 52,
      ctx,
    });
    const end = counterDemoBlockSurface({
      counter: 10,
      previousCounter: 0,
      animationTimeMs: 480,
      width: 52,
      ctx,
    });
    const startText = surfaceToString(start, ctx.style);
    const endText = surfaceToString(end, ctx.style);

    expect(startText).toContain('Counter: 10');
    expect(endText).toContain('Counter: 10');
    expect(startText).not.toBe(endText);
  });

  it('exports a frozen JSON snapshot shape for automation and MCP-style inspection', () => {
    const below = renderCounterDemoJson(-3);
    const inside = renderCounterDemoJson(6);
    const above = renderCounterDemoJson(42);

    expect(below).toEqual({ counter: 0 });
    expect(inside).toEqual({ counter: 6 });
    expect(above).toEqual({ counter: 10 });
    expect(Object.isFrozen(inside)).toBe(true);
  });

  it('is visible as a Storybook fixture without shipping as a standard block', () => {
    const story = findComponentStory('fixture-counter-block');
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 96, rows: 32 } });

    expect(story).toBeDefined();
    expect(story?.package).toBe('bijou');
    expect(story?.family).toBe('Blocks');
    expect(story?.variants.map((variant) => variant.id)).toEqual([
      'interactive',
      'static',
      'json',
    ]);
    const preview = story!.variants[0]!.render({
      width: 72,
      ctx,
      state: undefined,
      timeMs: 240,
    });
    if (typeof preview === 'string') {
      throw new Error('expected counter fixture Storybook preview to render a Surface');
    }
    expect(surfaceToString(preview, ctx.style)).toContain('Counter: 7');
  });
});

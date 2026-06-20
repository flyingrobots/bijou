import { afterEach, describe, expect, it, vi } from 'vitest';
import { must, createTestContext, type TestContext  } from '@flyingrobots/bijou/adapters/test';
import { chalkStyle } from '@flyingrobots/bijou-node';
import type { App, KeyMsg } from '@flyingrobots/bijou-tui';
import { runScript } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from '../packages/bijou-tui-app/src/index.js';
import { normalizeViewOutput } from '../packages/bijou-tui/src/view-output.js';
import {
  assertFrameWidth,
  renderFrameText,
  renderFrameTexts,
} from './frame-assertions.js';

interface ExampleModule<Model, M = never> {
  readonly app: App<Model, M>;
  readonly css?: string;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@flyingrobots/bijou-node');
});

async function loadExample<Model, M = never>(
  modulePath: string,
  runtime: { columns: number; rows: number },
  options: { style?: TestContext['style'] } = {},
): Promise<{ module: ExampleModule<Model, M>; ctx: TestContext }> {
  vi.resetModules();
  vi.doUnmock('@flyingrobots/bijou-node');
  const ctx = createTestContext({
    mode: 'interactive',
    runtime,
    style: options.style,
  });

  vi.doMock('@flyingrobots/bijou-node', async () => {
    const actual = await vi.importActual<typeof import('@flyingrobots/bijou-node')>('@flyingrobots/bijou-node');
    return {
      ...actual,
      initDefaultContext: () => ctx,
    };
  });

  const loaded: unknown = await import(modulePath);
  if (!isExampleModule<Model, M>(loaded)) {
    throw new Error(`Example module ${modulePath} did not export an app`);
  }
  const module = loaded;
  return { module, ctx };
}

function isExampleModule<Model, M>(value: unknown): value is ExampleModule<Model, M> {
  return typeof value === 'object' && value !== null && 'app' in value;
}

describe('frame regressions', () => {
  it('captures stable scaffold home and split frames', async () => {
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 64, rows: 18 },
    });
    const app = createTuiAppSkeleton({ ctx });
    const [model] = app.init();
    const initialFrame = renderFrameText(normalizeViewOutput(app.view(model), {
      width: ctx.runtime.columns,
      height: ctx.runtime.rows,
    }).surface, ctx.style);
    const result = await runScript(app, [{ key: ']' }], { ctx });

    expect(initialFrame).toMatchSnapshot('scaffold-home');
    expect(renderFrameText(must(result.frames.at(-1)), ctx.style)).toMatchSnapshot('scaffold-split');
  });

  it('keeps scaffold frames width-correct through scripted resizes', async () => {
    const ctx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 64, rows: 18 },
    });
    const app = createTuiAppSkeleton({ ctx });
    const result = await runScript(app, [
      { resize: { columns: 120, rows: 36 } },
      { resize: { columns: 92, rows: 24 } },
    ], { ctx });
    const frames = renderFrameTexts(result.frames, ctx.style);

    expect(result.frames).toHaveLength(3);
    assertFrameWidth(must(frames[1]), 120);
    assertFrameWidth(must(frames[2]), 92);
    expect(frames[1]).toContain('Home ready');
    expect(frames[2]).toContain('Home ready');
  });

  it('locks the starter V3 demo frames', async () => {
    const { module, ctx } = await loadExample('../examples/v3-demo/main.ts', { columns: 72, rows: 20 });
    const spaceKey: KeyMsg = { type: 'key', key: ' ', ctrl: false, alt: false, shift: false };
    const result = await runScript(module.app as App<unknown, KeyMsg>, [{ msg: spaceKey }], { ctx });

    expect(renderFrameText(must(result.frames[0]), ctx.style, { crop: true })).toMatchSnapshot('v3-demo-initial');
    expect(renderFrameText(must(result.frames[1]), ctx.style, { crop: true })).toMatchSnapshot('v3-demo-after-space');
  });

  it('locks the BCSS demo frames across responsive width changes', async () => {
    const style = chalkStyle({ level: 3 });
    const narrow = await loadExample('../examples/v3-css/main.ts', { columns: 72, rows: 18 }, { style });
    const narrowResult = await runScript(narrow.module.app, [], {
      ctx: narrow.ctx,
      css: narrow.module.css,
    });
    const wide = await loadExample('../examples/v3-css/main.ts', { columns: 96, rows: 18 }, { style });
    const wideResult = await runScript(wide.module.app, [], {
      ctx: wide.ctx,
      css: wide.module.css,
    });

    const narrowText = renderFrameText(must(narrowResult.frames[0]), narrow.ctx.style);
    const wideText = renderFrameText(must(wideResult.frames[0]), wide.ctx.style);
    expect(renderFrameText(must(narrowResult.frames[0]), narrow.ctx.style, { crop: true, preserveAnsi: true })).toMatchSnapshot('v3-css-narrow');
    expect(renderFrameText(must(wideResult.frames[0]), wide.ctx.style, { crop: true, preserveAnsi: true })).toMatchSnapshot('v3-css-wide');
    expect(narrowText).toContain('Current width:');
    expect(narrowText).not.toContain('Current width: 96');
    expect(wideText).toContain('Current width: 96');
    expect(narrowText).not.toBe(wideText);
  });

  it('locks the fractal sub-app demo frames after child updates', async () => {
    const { module, ctx } = await loadExample('../examples/v3-subapp/main.ts', { columns: 72, rows: 20 });
    const result = await runScript(module.app, [
      { key: 'a' },
      { key: 'k' },
      { key: 'm' },
    ], { ctx });

    expect(renderFrameText(must(result.frames[0]), ctx.style, { crop: true })).toMatchSnapshot('v3-subapp-initial');
    expect(renderFrameText(must(result.frames.at(-1)), ctx.style, { crop: true })).toMatchSnapshot('v3-subapp-updated');
  });
});

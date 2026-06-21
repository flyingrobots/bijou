
import {
  afterEach,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  it,
  keyMsg,
  QUIT,
  runScript,
  serializeFrame,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('opens landing quit confirm with escape and quits on confirmation', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    let cmds: ReturnType<typeof app.update>[1];

    [model, cmds] = app.update(keyMsg('escape'), model);
    expect((model).landingQuitConfirmOpen).toBe(true);
    expect(cmds).toHaveLength(0);

    [model, cmds] = app.update(keyMsg('y'), model);
    expect((model).landingQuitConfirmOpen).toBe(false);
    expect(cmds).toHaveLength(1);

    const returned = await must(cmds[0])(() => undefined, { onPulse: () => ({ dispose: () => undefined }) });
    expect(returned).toBe(QUIT);
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('dismisses the landing quit confirm with n', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    let [model] = app.init();
    [model] = app.update(keyMsg('escape'), model);
    expect((model).landingQuitConfirmOpen).toBe(true);

    [model] = app.update(keyMsg('n'), model);
    expect((model).landingQuitConfirmOpen).toBe(false);
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('quits immediately from the landing screen in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const [model] = app.init();
    const [, cmds] = app.update(keyMsg('escape'), model);
    expect(cmds).toHaveLength(1);

    const returned = await must(cmds[0])(() => undefined, { onPulse: () => ({ dispose: () => undefined }) });
    expect(returned).toBe(QUIT);
  });
});

describe('docs preview app', () => {
afterEach(() => { _resetDefaultContextForTesting(); });

it('animates the landing title screen on pulse', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const pulsed = await runScript(app, [{ pulse: { dt: 0.35 } }], { ctx });

    expect((pulsed.model).route).toBe('landing');
    expect(serializeFrame(must(initial.frames[0]))).not.toEqual(serializeFrame(must(pulsed.frames[pulsed.frames.length - 1])));
  });
});

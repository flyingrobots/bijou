import type { SemanticSceneDiagnostic } from '@flyingrobots/bijou-tui';
import { describe, expect, it } from 'vitest';
import { mountControls, type MountedControls } from './dom-mount.test-support.js';

/** Every message that reaches the bus after this call. */
function messages(mounted: MountedControls): unknown[] {
  const log: unknown[] = [];
  mounted.handle.controller.bus.on((message) => { log.push(message); });
  return log;
}

describe('mountBijouDom() event bridge', () => {
  it.each(['Enter', ' '])('activates a native button exactly once for %j', (key) => {
    const mounted = mountControls();
    const log = messages(mounted);

    mounted.doc.press(mounted.node('app.increment'), key);

    expect(log).toEqual([{ type: 'increment' }]);
    expect(mounted.handle.controller.frame().model.count).toBe(1);
    mounted.handle.stop();
  });

  it.each(['Enter', ' '])('activates a plain actionable element once for %j and prevents the default', (key) => {
    const mounted = mountControls();
    const log = messages(mounted);

    const keydown = mounted.doc.dispatch(mounted.node('app.chip'), 'keydown', { key });

    expect(keydown.defaultPrevented).toBe(true);
    expect(log).toEqual([{ type: 'chip' }]);
    mounted.handle.stop();
  });

  it('ignores other keys and keydown on a text input', () => {
    const mounted = mountControls();
    const log = messages(mounted);

    mounted.doc.press(mounted.node('app.chip'), 'a');
    mounted.doc.press(mounted.node('app.name'), 'Enter');

    expect(log).toEqual([]);
    mounted.handle.stop();
  });

  it('dispatches typed text with the input value', () => {
    const mounted = mountControls();
    const log = messages(mounted);

    mounted.doc.type(mounted.node('app.name'), 'Ada');

    expect(log).toEqual([{ type: 'rename', name: 'Ada' }]);
    mounted.handle.stop();
  });

  it.each([false, true])('dispatches committed composition text once (compositionend first: %s)', (endFirst) => {
    const mounted = mountControls();
    const log = messages(mounted);

    mounted.doc.compose(mounted.node('app.name'), ['a', 'あ'], '愛', endFirst);

    expect(log).toEqual([{ type: 'rename', name: '愛' }]);
    expect(mounted.handle.controller.frame().model.name).toBe('愛');
    mounted.handle.stop();
  });

  it('dispatches nothing while a composition is in progress, and keeps its text', () => {
    const mounted = mountControls();
    const log = messages(mounted);
    const input = mounted.node('app.name');

    mounted.doc.dispatch(input, 'compositionstart');
    input.userValue('あ');
    mounted.doc.dispatch(input, 'input', { isComposing: true });
    mounted.handle.controller.invoke({ actionId: 'app.name', value: 'scene' });

    expect(log).toEqual([{ type: 'rename', name: 'scene' }]);
    expect(input.value).toBe('あ');
    mounted.handle.stop();
  });

  it('ignores an action for a node that left the scene', () => {
    const diagnostics: SemanticSceneDiagnostic[] = [];
    const mounted = mountControls({ onDiagnostic: (diagnostic) => diagnostics.push(diagnostic) });
    mounted.doc.dispatch(mounted.node('app.increment'), 'click');
    const reset = mounted.node('app.reset');
    mounted.doc.dispatch(reset, 'click');
    const log = messages(mounted);

    mounted.doc.dispatch(reset, 'click');
    const result = mounted.handle.controller.invoke({ actionId: 'app.reset' });

    expect(log).toEqual([]);
    expect(result.status).toBe('ignored');
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['action-not-declared']);
    expect(mounted.handle.controller.frame().model.count).toBe(0);
    mounted.handle.stop();
  });
});

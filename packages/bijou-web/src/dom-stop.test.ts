import { createSurface, type UiNode } from '@flyingrobots/bijou';
import type { SemanticSceneApp } from '@flyingrobots/bijou-tui';
import { describe, expect, it } from 'vitest';
import { createWebClock } from './clock.js';
import { createFakeClockHost } from './clock.test-support.js';
import { createWebContext } from './context.js';
import { controlsScene, type ControlsModel } from './dom-app.test-support.js';
import { FakeDocument } from './dom-document.test-support.js';
import { mountBijouDom } from './dom-mount.js';
import { mountControls } from './dom-mount.test-support.js';

describe('mountBijouDom() teardown', () => {
  it('stop() removes every listener, TEA timer, and the root, and is idempotent', async () => {
    const { container, doc, handle, host } = mountControls({}, { timers: true });
    await handle.controller.bus.drain();
    host.advance(1000);
    expect(handle.controller.frame().model.ticks).toBe(1);
    expect(host.liveTimers()).toBe(1);
    expect(doc.liveListeners()).toBeGreaterThan(0);

    handle.stop();
    handle.stop();

    expect(doc.liveListeners()).toBe(0);
    expect(host.liveTimers()).toBe(0);
    expect(container.childNodes.length).toBe(0);
    expect(handle.controller.status).toBe('stopped');
  });

  it('writes nothing for a theme change, event, or action after stop()', () => {
    const { ctx, doc, handle, node } = mountControls();
    const increment = node('app.increment');
    handle.stop();
    const before = { ...doc.counts };

    ctx.tokenGraph.set('semantic.primary', { hex: '#00ff00' });
    doc.dispatch(increment, 'click');
    const result = handle.controller.invoke({ actionId: 'app.increment' });

    expect(doc.counts).toEqual(before);
    expect(result.status).toBe('ignored');
  });

  it('stops the controller and attaches nothing when the first scene cannot be lowered', async () => {
    const doc = new FakeDocument();
    const container = doc.createElement('main');
    doc.body.appendChild(container);
    const host = createFakeClockHost();
    const clock = createWebClock({ host });
    const ctx = createWebContext({ clock });
    const scene = controlsScene({ count: 0, name: '', enabled: true, dir: 'ltr', ticks: 0, showChip: true });
    const app: SemanticSceneApp<ControlsModel> = {
      init: () => [{ count: 0, name: '', enabled: true, dir: 'ltr', ticks: 0, showChip: true }, [() => {
        const interval = clock.setInterval(() => undefined, 1000);
        return () => { interval.dispose(); };
      }]],
      update: (_msg, model) => [model, []],
      view: () => createSurface(1, 1),
      viewScene: () => ({ ...scene, nodes: scene.nodes.map((node): UiNode => node.id === 'app' ? { ...node, kind: 'box' } : node) }),
      dispatchAction: () => undefined,
    };

    expect(() => mountBijouDom(app, container, { ctx })).toThrow(/Cannot lower ui-scene-ir\/1 node app \(box\)/u);
    expect(host.liveTimers()).toBe(1);
    await new Promise<void>((resolve) => { queueMicrotask(resolve); });
    expect(container.childNodes.length).toBe(0);
    expect(doc.liveListeners()).toBe(0);
    expect(host.liveTimers()).toBe(0);
  });
});

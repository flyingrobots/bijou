import { describe, expect, it } from 'vitest';
import { mountBijouCanvas } from './index.js';
import { counterApp, createCanvasEnv } from './canvas-env.test-support.js';
import { withPrevent } from './interactive.test-support.js';

// In a real browser, a click on a canvas runs pointerdown, then the mousedown
// default action, which moves focus to the canvas's focusable ancestor (often
// <body>) because a canvas is not focusable, then pointerup. Found by the
// examples/web-gpu browser suite: focusing only on pointerdown lost the focus
// again, so no key reached the app.
describe('mountBijouCanvas() focus on a press', () => {
  it('focuses the textarea again on release, after the browser moved focus away during the press', async () => {
    const env = createCanvasEnv();
    const mounting = mountBijouCanvas(counterApp, env.container, env.options());
    env.host.box(800, 480);
    const handle = await mounting;
    await env.drive();
    const [canvas] = env.maker.made;
    const doc = env.container.ownerDocument;
    canvas?.dispatch('pointerdown', withPrevent({ clientX: 15, clientY: 25, button: 0 }));
    doc.activeElement = null;
    canvas?.dispatch('pointerup', withPrevent({ clientX: 15, clientY: 25, button: 0 }));
    expect(doc.activeElement).toBe(handle.textarea);
    env.press('a');
    await env.drive();
    expect(handle.model()).toEqual({ count: 1 });
    await env.stop(handle);
  });
});

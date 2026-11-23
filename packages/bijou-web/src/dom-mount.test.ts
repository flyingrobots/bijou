import { describe, expect, it } from 'vitest';
import { mountControls } from './dom-mount.test-support.js';

describe('mountBijouDom()', () => {
  it('mounts a semantic scene app as native elements with no terminal grid or ANSI', () => {
    const { container, ctx, handle, node, root } = mountControls();

    expect(container.childNodes.length).toBe(1);
    expect(container.childNodes[0]).toBe(handle.root);
    expect(root().getAttribute('data-bijou-scene-id')).toBe('fixture.controls');
    expect(node('app').tagName).toBe('div');
    expect(node('app').getAttribute('role')).toBe('region');
    expect(node('app.count').getAttribute('role')).toBe('status');
    expect(node('app.increment').tagName).toBe('button');
    expect(node('app.increment').getAttribute('type')).toBe('button');
    expect(node('app.name').tagName).toBe('input');
    expect(node('app.name').getAttribute('type')).toBe('text');
    expect(node('app.enabled').tagName).toBe('button');
    expect(node('app.chip').tagName).toBe('span');
    expect(node('app.chip').getAttribute('tabindex')).toBe('0');
    expect(root().textContent).toBe('Count 0incrementOnthemedirectionchip');
    expect(root().textContent).not.toContain('\u001b');
    expect(ctx.io.output()).toBe('');
    handle.stop();
  });

  it('runs the app interactively: a click dispatches and the scene patches in place', () => {
    const { doc, handle, node } = mountControls();
    const count = node('app.count');

    doc.dispatch(node('app.increment'), 'click');

    expect(handle.controller.frame().model.count).toBe(1);
    expect(node('app.count')).toBe(count);
    expect(count.textContent).toBe('Count 1');
    expect(node('app.reset').tagName).toBe('button');
    handle.stop();
  });
});

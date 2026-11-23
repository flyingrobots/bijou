import { describe, expect, it } from 'vitest';
import { mountControls } from './dom-mount.test-support.js';

describe('mountBijouDom() focus fallback', () => {
  it('moves focus to the first declared focusable node the new scene still has', () => {
    const { doc, handle, node } = mountControls({ focusableNodeIds: ['app.reset', 'app.missing', 'app.name'] });
    doc.dispatch(node('app.increment'), 'click');
    const reset = node('app.reset');
    reset.focus();

    doc.press(reset, 'Enter');

    expect(handle.controller.frame().model.count).toBe(0);
    expect(doc.activeElement).toBe(node('app.name'));
    handle.stop();
  });

  it('falls back to the nearest surviving ancestor when no declared node remains', () => {
    const { doc, handle, node } = mountControls();
    const chip = node('app.chip');
    chip.focus();

    doc.press(chip, ' ');

    const region = node('app');
    expect(doc.activeElement).toBe(region);
    expect(region.getAttribute('tabindex')).toBe('-1');
    expect(doc.activeElement).not.toBe(doc.body);
    handle.stop();
  });

  it('leaves focus alone when the focused node stays in the scene', () => {
    const { doc, handle, node } = mountControls({ focusableNodeIds: ['app.name'] });
    const increment = node('app.increment');
    increment.focus();

    doc.press(increment, 'Enter');

    expect(doc.activeElement).toBe(increment);
    handle.stop();
  });
});

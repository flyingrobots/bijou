import { describe, expect, it } from 'vitest';
import { mountShapes } from './dom-shapes.test-support.js';

describe('mountBijouDom() reshaped scenes', () => {
  it('restores focus to a kept element that a reorder moved', () => {
    const { doc, handle, next, node } = mountShapes([[['a', 'button'], ['b', 'button']], [['b', 'button'], ['a', 'button']]]);
    const b = node('b');
    b.focus();

    next();

    expect(node('b')).toBe(b);
    expect(doc.activeElement).toBe(b);
    handle.stop();
  });

  it('does not move a focused element when an earlier sibling leaves', () => {
    const { doc, handle, next, node } = mountShapes([
      [['a', 'button'], ['b', 'button'], ['c', 'button']],
      [['a', 'button'], ['c', 'button']],
    ]);
    const c = node('c');
    c.focus();
    const writes = doc.counts.writes;

    next();

    expect(doc.activeElement).toBe(c);
    expect(doc.counts.writes - writes).toBe(1);
    handle.stop();
  });

  it('makes a replacement plain element focusable before focusing it', () => {
    const { doc, handle, next, node } = mountShapes([[['x', 'button']], [['x', undefined]]]);
    const button = node('x');
    button.focus();

    next();

    const span = node('x');
    expect(span).not.toBe(button);
    expect(span.tagName).toBe('span');
    expect(span.getAttribute('tabindex')).toBe('-1');
    expect(doc.activeElement).toBe(span);
    handle.stop();
  });

  it('clears the composition state of an input that a new element replaces', () => {
    const { doc, handle, next, node } = mountShapes([[['x', 'textbox']], [['x', 'button']], [['x', 'textbox']]]);
    doc.dispatch(node('x'), 'compositionstart');

    next();
    next();
    doc.type(node('x'), 'ok');

    expect(node('x').tagName).toBe('input');
    expect(handle.controller.frame().model.values).toEqual(['ok']);
    handle.stop();
  });
});

import { describe, expect, it } from 'vitest';
import { mountControls } from './dom-mount.test-support.js';

describe('mountBijouDom() keyed in-place patching', () => {
  it('keeps the active input node and its selection across re-renders', () => {
    const { doc, handle, node } = mountControls();
    const input = node('app.name');
    input.focus();

    doc.type(input, 'Ada', 1);
    input.selectionEnd = 3;
    doc.dispatch(node('app.increment'), 'click');

    expect(handle.controller.frame().model).toMatchObject({ name: 'Ada', count: 1 });
    expect(node('app.name')).toBe(input);
    expect(doc.activeElement).toBe(input);
    expect([input.value, input.selectionStart, input.selectionEnd]).toEqual(['Ada', 1, 3]);
    handle.stop();
  });

  it('does not rewrite the active input value unless the scene changed it', () => {
    const { doc, handle, node } = mountControls();
    const input = node('app.name');
    input.focus();
    doc.type(input, 'Ada');

    input.userValue('Adaz', 2);
    doc.dispatch(node('app.increment'), 'click');

    expect([input.value, input.selectionStart]).toEqual(['Adaz', 2]);
    handle.stop();
  });

  it('writes a value that the scene changed into the same input element', () => {
    const { handle, node } = mountControls();
    const input = node('app.name');

    handle.controller.invoke({ actionId: 'app.name', value: 'Bo' });

    expect(node('app.name')).toBe(input);
    expect(input.value).toBe('Bo');
    handle.stop();
  });

  it('diffs attributes and text, so an unchanged node gets no write', () => {
    const { doc, handle, node } = mountControls();
    const increment = node('app.increment');
    doc.dispatch(increment, 'click');
    const before = { ...doc.counts };

    doc.dispatch(increment, 'click');

    expect(doc.counts.created).toBe(before.created);
    expect(doc.counts.writes - before.writes).toBe(1);
    expect(node('app.count').textContent).toBe('Count 2');
    handle.stop();
  });

  it('removes a node that leaves the scene and keeps every other element', () => {
    const { doc, handle, node, root } = mountControls();
    const ids = ['app', 'app.count', 'app.increment', 'app.name', 'app.enabled', 'app.theme', 'app.dir'];
    const before = ids.map((id) => node(id));

    doc.dispatch(node('app.chip'), 'click');

    expect(ids.map((id) => node(id)).every((element, index) => element === before[index])).toBe(true);
    expect(root().find((element) => element.getAttribute('data-bijou-node-id') === 'app.chip')).toBeUndefined();
    expect(node('app').childNodes.length).toBe(6);
    handle.stop();
  });

  it('inserts a node that enters the scene at its scene position', () => {
    const { doc, handle, node } = mountControls();

    doc.dispatch(node('app.increment'), 'click');

    const order = node('app').childNodes.map((child) =>
      'getAttribute' in child ? child.getAttribute('data-bijou-node-id') : null);
    expect(order).toEqual([
      'app.count', 'app.increment', 'app.name', 'app.enabled', 'app.theme', 'app.dir', 'app.chip', 'app.reset',
    ]);
    handle.stop();
  });
});

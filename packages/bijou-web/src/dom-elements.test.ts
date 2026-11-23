import type { UiSceneBrowserElement } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { hostSpec } from './dom-elements.js';

function lowered(role: string, checked?: string): UiSceneBrowserElement {
  return {
    tag: 'span',
    attributes: [
      { name: 'data-bijou-node-id', value: 'n' },
      { name: 'data-bijou-role', value: role },
      ...(checked === undefined ? [] : [{ name: 'data-bijou-checked', value: checked }]),
    ],
    children: [],
  };
}

const added = (role: string, checked?: string): Record<string, string> =>
  Object.fromEntries(hostSpec(lowered(role, checked)).attributes.filter((a) => !a.name.startsWith('data-')).map((a) => [a.name, a.value]));

describe('hostSpec() switch state', () => {
  it('adds role="switch" and aria-checked for a switch that declares the state', () => {
    expect(added('switch', 'true')).toEqual({ type: 'button', role: 'switch', 'aria-checked': 'true' });
    expect(added('switch', 'false')).toEqual({ type: 'button', role: 'switch', 'aria-checked': 'false' });
  });

  it('keeps today\'s rendering for a switch without the state', () => {
    expect(added('switch')).toEqual({ type: 'button' });
  });

  it('ignores the state on a node that is not a switch', () => {
    expect(added('button', 'true')).toEqual({ type: 'button' });
    expect(added('status', 'true')).toEqual({ role: 'status' });
  });
});

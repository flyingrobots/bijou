import { describe, it, expect } from 'vitest';
import { createAccordionState, focusNext, focusPrev } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

describe('focusPrev', () => {
  it('decrements focus by 1', () => {
    let state = createAccordionState(sections);
    state = focusNext(state); // now at 1
    expect(focusPrev(state).focusIndex).toBe(0);
  });
  it('wraps around to last section', () => {
    const state = createAccordionState(sections);
    expect(focusPrev(state).focusIndex).toBe(2);
  });
});

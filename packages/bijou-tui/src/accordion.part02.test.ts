import { describe, it, expect } from 'vitest';
import { createAccordionState, focusNext } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

// ── focusNext / focusPrev ─────────────────────────────────────────
describe('focusNext', () => {
  it('advances focus by 1', () => {
    const state = createAccordionState(sections);
    expect(focusNext(state).focusIndex).toBe(1);
  });
  it('wraps around to 0', () => {
    let state = createAccordionState(sections);
    state = focusNext(state);
    state = focusNext(state);
    state = focusNext(state);
    expect(state.focusIndex).toBe(0);
  });
  it('handles empty sections', () => {
    const state = createAccordionState([]);
    expect(focusNext(state).focusIndex).toBe(0);
  });
});

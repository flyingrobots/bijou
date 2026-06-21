import { describe, it, expect } from 'vitest';
import { createAccordionState, focusNext, toggleFocused } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

// ── toggleFocused ─────────────────────────────────────────────────
describe('toggleFocused', () => {
  it('toggles expanded state of focused section', () => {
    const state = createAccordionState(sections);
    // Section 0 starts expanded
    const toggled = toggleFocused(state);
    expect(toggled.sections[0]?.expanded).toBe(false);
    expect(toggled.sections[1]?.expanded).toBe(false); // unchanged
  });
  it('expands a collapsed section', () => {
    let state = createAccordionState(sections);
    state = focusNext(state); // focus on section 1 (collapsed)
    const toggled = toggleFocused(state);
    expect(toggled.sections[1]?.expanded).toBe(true);
  });
  it('does not mutate other sections', () => {
    const state = createAccordionState(sections);
    const toggled = toggleFocused(state);
    expect(toggled.sections[1]).toEqual(state.sections[1]);
    expect(toggled.sections[2]).toEqual(state.sections[2]);
  });
  it('handles empty sections', () => {
    const state = createAccordionState([]);
    expect(toggleFocused(state).sections).toHaveLength(0);
  });
});

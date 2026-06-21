import { describe, it, expect } from 'vitest';
import { createAccordionState } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';
import { must } from '@flyingrobots/bijou/adapters/test';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

// ── createAccordionState ──────────────────────────────────────────
describe('createAccordionState', () => {
  it('initializes with focusIndex 0', () => {
    const state = createAccordionState(sections);
    expect(state.focusIndex).toBe(0);
  });
  it('preserves section expanded state', () => {
    const state = createAccordionState(sections);
    expect(state.sections[0]?.expanded).toBe(true);
    expect(state.sections[1]?.expanded).toBe(false);
  });
  it('copies sections (no shared references)', () => {
    const original = [{ title: 'A', content: 'a', expanded: false }];
    const state = createAccordionState(original);
    must(original[0]).expanded = true;
    expect(state.sections[0]?.expanded).toBe(false);
  });
});

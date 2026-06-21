import { describe, it, expect } from 'vitest';
import { createAccordionState, expandAll } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

// ── expandAll / collapseAll ───────────────────────────────────────
describe('expandAll', () => {
  it('expands all sections', () => {
    const state = createAccordionState(sections);
    const expanded = expandAll(state);
    for (const s of expanded.sections) {
      expect(s.expanded).toBe(true);
    }
  });
});

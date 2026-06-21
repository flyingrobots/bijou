import { describe, it, expect } from 'vitest';
import { createAccordionState, collapseAll } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

describe('collapseAll', () => {
  it('collapses all sections', () => {
    const state = createAccordionState(sections);
    const collapsed = collapseAll(state);
    for (const s of collapsed.sections) {
      expect(s.expanded).toBe(false);
    }
  });
});

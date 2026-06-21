import { describe, it, expect } from 'vitest';
import { createAccordionState, focusNext, interactiveAccordion } from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

// ── Test Data ──────────────────────────────────────────────────────
const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

// ── interactiveAccordion ──────────────────────────────────────────
describe('interactiveAccordion', () => {
  it('renders with focus indicator on first section', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const state = createAccordionState(sections);
    const output = interactiveAccordion(state, { ctx });
    const lines = output.split('\n');
    // First line should start with "> "
    expect(lines[0]).toMatch(/^> /);
  });
  it('moves focus indicator with state', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const state = focusNext(createAccordionState(sections));
    const output = interactiveAccordion(state, { ctx });
    // The second section's header should have the focus indicator
    // Find section blocks (separated by blank lines)
    const blocks = output.split('\n\n');
    expect(blocks[0]).toMatch(/^\s\s/); // first section: no focus (indented with spaces)
    expect(blocks[1]).toMatch(/^> /);   // second section: focused
  });
  it('non-focused sections are indented with spaces', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const state = createAccordionState(sections);
    const output = interactiveAccordion(state, { ctx });
    const blocks = output.split('\n\n');
    // Second section should start with "  " (not "> ")
    expect(blocks[1]).toMatch(/^\s\s/);
  });
  it('renders empty string for empty sections', () => {
    const state = createAccordionState([]);
    expect(interactiveAccordion(state)).toBe('');
  });
  it('renders expanded content with indentation', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const state = createAccordionState(sections);
    const output = interactiveAccordion(state, { ctx });
    // Section 0 is expanded, its content should appear
    expect(output).toContain('Content A');
  });
});

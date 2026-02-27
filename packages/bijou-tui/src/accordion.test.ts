import { describe, it, expect } from 'vitest';
import {
  createAccordionState,
  focusNext,
  focusPrev,
  toggleFocused,
  expandAll,
  collapseAll,
  interactiveAccordion,
  accordionKeyMap,
} from './accordion.js';
import type { AccordionSection } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { KeyMsg } from './types.js';

// ── Test Data ──────────────────────────────────────────────────────

const sections: AccordionSection[] = [
  { title: 'Alpha', content: 'Content A', expanded: true },
  { title: 'Beta', content: 'Content B', expanded: false },
  { title: 'Gamma', content: 'Content C', expanded: false },
];

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── createAccordionState ──────────────────────────────────────────

describe('createAccordionState', () => {
  it('initializes with focusIndex 0', () => {
    const state = createAccordionState(sections);
    expect(state.focusIndex).toBe(0);
  });

  it('preserves section expanded state', () => {
    const state = createAccordionState(sections);
    expect(state.sections[0]!.expanded).toBe(true);
    expect(state.sections[1]!.expanded).toBe(false);
  });

  it('copies sections (no shared references)', () => {
    const original = [{ title: 'A', content: 'a', expanded: false }];
    const state = createAccordionState(original);
    original[0]!.expanded = true;
    expect(state.sections[0]!.expanded).toBe(false);
  });
});

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

// ── toggleFocused ─────────────────────────────────────────────────

describe('toggleFocused', () => {
  it('toggles expanded state of focused section', () => {
    const state = createAccordionState(sections);
    // Section 0 starts expanded
    const toggled = toggleFocused(state);
    expect(toggled.sections[0]!.expanded).toBe(false);
    expect(toggled.sections[1]!.expanded).toBe(false); // unchanged
  });

  it('expands a collapsed section', () => {
    let state = createAccordionState(sections);
    state = focusNext(state); // focus on section 1 (collapsed)
    const toggled = toggleFocused(state);
    expect(toggled.sections[1]!.expanded).toBe(true);
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

describe('collapseAll', () => {
  it('collapses all sections', () => {
    const state = createAccordionState(sections);
    const collapsed = collapseAll(state);
    for (const s of collapsed.sections) {
      expect(s.expanded).toBe(false);
    }
  });
});

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

// ── accordionKeyMap ───────────────────────────────────────────────

describe('accordionKeyMap', () => {
  type Msg = { type: string };

  const km = accordionKeyMap<Msg>({
    focusNext: { type: 'next' },
    focusPrev: { type: 'prev' },
    toggle: { type: 'toggle' },
    quit: { type: 'quit' },
  });

  it('handles j/k for navigation', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'next' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'prev' });
  });

  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'next' });
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'prev' });
  });

  it('handles enter/space for toggle', () => {
    expect(km.handle(keyMsg('enter'))).toEqual({ type: 'toggle' });
    expect(km.handle(keyMsg('space'))).toEqual({ type: 'toggle' });
  });

  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});

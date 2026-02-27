/**
 * Interactive accordion building block.
 *
 * Wraps the static `accordion()` from bijou core with focus management
 * and expand/collapse state transformers.
 *
 * ```ts
 * // In TEA init:
 * const accState = createAccordionState(sections);
 *
 * // In TEA view:
 * const output = interactiveAccordion(model.accordion);
 *
 * // In TEA update:
 * case 'focus-next':
 *   return [{ ...model, accordion: focusNext(model.accordion) }, []];
 * case 'toggle':
 *   return [{ ...model, accordion: toggleFocused(model.accordion) }, []];
 * ```
 */

import {
  accordion,
  type AccordionSection,
  type AccordionOptions,
} from '@flyingrobots/bijou';
import type { BijouContext } from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';

// Re-export AccordionSection for convenience
export type { AccordionSection } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccordionState {
  readonly sections: readonly AccordionSection[];
  readonly focusIndex: number;
}

export interface InteractiveAccordionOptions {
  /** Token for the expand/collapse indicator. */
  readonly indicatorToken?: AccordionOptions['indicatorToken'];
  /** Token for section titles. */
  readonly titleToken?: AccordionOptions['titleToken'];
  /** Character for the focus indicator. Default: '>' */
  readonly focusChar?: string;
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial accordion state from sections.
 * Preserves existing `expanded` flags; focus starts at index 0.
 */
export function createAccordionState(sections: AccordionSection[]): AccordionState {
  return {
    sections: sections.map((s) => ({ ...s })),
    focusIndex: 0,
  };
}

// ---------------------------------------------------------------------------
// State transformers
// ---------------------------------------------------------------------------

/** Move focus to the next section (wraps around). */
export function focusNext(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex + 1) % state.sections.length,
  };
}

/** Move focus to the previous section (wraps around). */
export function focusPrev(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex - 1 + state.sections.length) % state.sections.length,
  };
}

/** Toggle the expanded state of the focused section. */
export function toggleFocused(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  const sections = state.sections.map((s, i) =>
    i === state.focusIndex ? { ...s, expanded: !s.expanded } : s,
  );
  return { ...state, sections };
}

/** Expand all sections. */
export function expandAll(state: AccordionState): AccordionState {
  return { ...state, sections: state.sections.map((s) => ({ ...s, expanded: true })) };
}

/** Collapse all sections. */
export function collapseAll(state: AccordionState): AccordionState {
  return { ...state, sections: state.sections.map((s) => ({ ...s, expanded: false })) };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render the interactive accordion with a focus indicator on the
 * currently focused section.
 *
 * Delegates to the static `accordion()` for the actual rendering,
 * then prepends a focus indicator to the focused section's line.
 */
export function interactiveAccordion(
  state: AccordionState,
  options?: InteractiveAccordionOptions,
): string {
  if (state.sections.length === 0) return '';

  const focusChar = options?.focusChar ?? '>';

  // Render each section individually so we can prepend the focus indicator
  const renderedSections = state.sections.map((section, i) => {
    const rendered = accordion([section], {
      indicatorToken: options?.indicatorToken,
      titleToken: options?.titleToken,
      ctx: options?.ctx,
    });

    const prefix = i === state.focusIndex ? `${focusChar} ` : '  ';

    // Prepend the focus indicator to each line of the rendered section
    return rendered
      .split('\n')
      .map((line, lineIdx) => (lineIdx === 0 ? prefix + line : '  ' + line))
      .join('\n');
  });

  return renderedSections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for accordion navigation.
 */
export function accordionKeyMap<Msg>(actions: {
  focusNext: Msg;
  focusPrev: Msg;
  toggle: Msg;
  quit: Msg;
}): KeyMap<Msg> {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Next section', actions.focusNext)
      .bind('down', 'Next section', actions.focusNext)
      .bind('k', 'Previous section', actions.focusPrev)
      .bind('up', 'Previous section', actions.focusPrev),
    )
    .group('Actions', (g) => g
      .bind('enter', 'Toggle section', actions.toggle)
      .bind('space', 'Toggle section', actions.toggle),
    )
    .bind('q', 'Quit', actions.quit)
    .bind('ctrl+c', 'Quit', actions.quit);
}

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
  type BijouContext,
} from '@flyingrobots/bijou';
import { createKeyMap, type KeyMap } from './keybindings.js';

// Re-export AccordionSection for convenience
export type { AccordionSection } from '@flyingrobots/bijou';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Immutable state for the interactive accordion widget. */
export interface AccordionState {
  /** All accordion sections with their expand/collapse state. */
  readonly sections: readonly AccordionSection[];
  /** Index of the currently focused section. */
  readonly focusIndex: number;
}

/** Options for rendering the interactive accordion view. */
export interface InteractiveAccordionOptions {
  /** Token for the expand/collapse indicator. */
  readonly indicatorToken?: AccordionOptions['indicatorToken'];
  /** Token for section titles. */
  readonly titleToken?: AccordionOptions['titleToken'];
  /** Character for the focus indicator. Default: '>' */
  readonly focusChar?: string;
  /** Bijou context for theming and styling. */
  readonly ctx?: BijouContext;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create initial accordion state from sections.
 * Preserves existing `expanded` flags; focus starts at index 0.
 *
 * @param sections - Accordion sections to populate the widget.
 * @returns Fresh accordion state with focus on the first section.
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

/**
 * Move focus to the next section (wraps around).
 *
 * @param state - Current accordion state.
 * @returns Updated accordion state with focus on the next section.
 */
export function focusNext(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex + 1) % state.sections.length,
  };
}

/**
 * Move focus to the previous section (wraps around).
 *
 * @param state - Current accordion state.
 * @returns Updated accordion state with focus on the previous section.
 */
export function focusPrev(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex - 1 + state.sections.length) % state.sections.length,
  };
}

/**
 * Toggle the expanded state of the focused section.
 *
 * @param state - Current accordion state.
 * @returns Updated accordion state with the focused section toggled.
 */
export function toggleFocused(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  const sections = state.sections.map((s, i) =>
    i === state.focusIndex ? { ...s, expanded: !s.expanded } : s,
  );
  return { ...state, sections };
}

/**
 * Expand all sections.
 *
 * @param state - Current accordion state.
 * @returns Updated accordion state with all sections expanded.
 */
export function expandAll(state: AccordionState): AccordionState {
  return { ...state, sections: state.sections.map((s) => ({ ...s, expanded: true })) };
}

/**
 * Collapse all sections.
 *
 * @param state - Current accordion state.
 * @returns Updated accordion state with all sections collapsed.
 */
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
/**
 * @param state - Current accordion state.
 * @param options - Rendering options (indicators, focus char, context).
 * @returns Rendered accordion string with focus indicator on the active section.
 */
export function interactiveAccordion(
  state: AccordionState,
  options?: InteractiveAccordionOptions,
): string {
  if (state.sections.length === 0) return '';

  const focusChar = options?.focusChar ?? '>';
  // Normalize focusIndex to avoid stale/out-of-range values
  const focusIndex = ((state.focusIndex % state.sections.length) + state.sections.length) % state.sections.length;
  // Continuation-line padding must match the focus prefix width
  const padWidth = focusChar.length + 1; // focusChar + space
  const continuationPad = ' '.repeat(padWidth);

  // Render each section individually so we can prepend the focus indicator
  const renderedSections = state.sections.map((section, i) => {
    const rendered = accordion([section], {
      indicatorToken: options?.indicatorToken,
      titleToken: options?.titleToken,
      ctx: options?.ctx,
    });

    const prefix = i === focusIndex ? `${focusChar} ` : continuationPad;

    // Prepend the focus indicator to each line of the rendered section
    return rendered
      .split('\n')
      .map((line, lineIdx) => (lineIdx === 0 ? prefix + line : continuationPad + line))
      .join('\n');
  });

  return renderedSections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Convenience keymap
// ---------------------------------------------------------------------------

/**
 * Create a preconfigured KeyMap for accordion navigation.
 *
 * @template Msg - Application message type dispatched by key bindings.
 * @param actions - Map of navigation and toggle actions to message values.
 * @returns Preconfigured key map with vim-style accordion bindings.
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

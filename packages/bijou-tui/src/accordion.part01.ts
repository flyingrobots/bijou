import { accordion } from '@flyingrobots/bijou';

import type { AccordionOptions, AccordionSection, BijouContext } from '@flyingrobots/bijou';
export interface AccordionState {
  /** All accordion sections with their expand/collapse state. */
  readonly sections: readonly AccordionSection[];
  /** Index of the currently focused section. */
  readonly focusIndex: number;
}
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
export function createAccordionState(sections: AccordionSection[]): AccordionState {
  return {
    sections: sections.map((s) => ({ ...s })),
    focusIndex: 0,
  };
}
export function focusNext(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex + 1) % state.sections.length,
  };
}
export function focusPrev(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  return {
    ...state,
    focusIndex: (state.focusIndex - 1 + state.sections.length) % state.sections.length,
  };
}
export function toggleFocused(state: AccordionState): AccordionState {
  if (state.sections.length === 0) return state;
  const sections = state.sections.map((s, i) =>
    i === state.focusIndex ? { ...s, expanded: !s.expanded } : s,
  );
  return { ...state, sections };
}
export function expandAll(state: AccordionState): AccordionState {
  return { ...state, sections: state.sections.map((s) => ({ ...s, expanded: true })) };
}
export function collapseAll(state: AccordionState): AccordionState {
  return { ...state, sections: state.sections.map((s) => ({ ...s, expanded: false })) };
}
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

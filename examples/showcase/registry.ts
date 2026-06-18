import type { ComponentEntry } from './types.js';
import { DISPLAY } from './registry-display.js';
import { DATA } from './registry-data.js';
import { FORMS } from './registry-forms.js';
import { TUI } from './registry-tui.js';

export interface Category {
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ComponentEntry[];
}

export const CATEGORIES: readonly Category[] = [
  { id: 'display', title: 'Display', entries: DISPLAY },
  { id: 'data', title: 'Data', entries: DATA },
  { id: 'forms', title: 'Forms', entries: FORMS },
  { id: 'tui', title: 'TUI', entries: TUI },
];

export function findEntry(id: string): ComponentEntry | undefined {
  return CATEGORIES.flatMap((category) => category.entries).find((entry) => entry.id === id);
}

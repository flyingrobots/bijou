import type { ComponentEntry } from './types.js';
import { DISPLAY } from './registry-display.js';
import { DATA } from './registry-data.js';
import { FORMS } from './registry-forms.js';
import { TUI } from './registry-tui.js';

export interface Category {
  id: string;
  name: string;
  entries: ComponentEntry[];
}

export const CATEGORIES: readonly Category[] = [
  { id: 'display', name: 'Display', entries: DISPLAY },
  { id: 'data', name: 'Data', entries: DATA },
  { id: 'forms', name: 'Forms', entries: FORMS },
  { id: 'tui', name: 'TUI', entries: TUI },
];

export function findEntry(id: string): ComponentEntry | undefined {
  return CATEGORIES.flatMap((category) => category.entries).find((entry) => entry.id === id);
}

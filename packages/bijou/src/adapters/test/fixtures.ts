import type { SelectOption } from '../../core/forms/types.js';

/** Standard color options for form tests. */
export const COLOR_OPTIONS: SelectOption<string>[] = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

/** Standard fruit options for form tests. */
export const FRUIT_OPTIONS: SelectOption<string>[] = [
  { label: 'Apple', value: 'apple', description: 'Crunchy' },
  { label: 'Banana', value: 'banana', description: 'Sweet' },
  { label: 'Cherry', value: 'cherry', description: 'Tart' },
];

/** A large set of numbered options for scrolling tests. */
export const MANY_OPTIONS: SelectOption<string>[] = Array.from({ length: 20 }, (_, i) => ({
  label: `Option ${i + 1}`,
  value: `v${i + 1}`,
}));

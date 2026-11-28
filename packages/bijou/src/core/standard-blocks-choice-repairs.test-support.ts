import type { BlockDefinition } from './block-metadata.js';
import { createTextSurface } from './components/surface-text.js';
import type { Surface } from '../ports/surface.js';
import {
  binaryDecisionBlock,
  multipleChoiceBlock,
  singleChoiceBlock,
  textEntryBlock,
} from './standard-blocks.test-support.js';
import { withoutSlot, type Slots } from './standard-blocks-choice-drawn.test-support.js';

/** What the repair tests (R1 to R3 of the family repair contract) know about one block. */
interface ChoiceRepairSpec {
  readonly block: BlockDefinition;
  /** Slots that put `surface` where the block draws slot content. */
  readonly withSurface: (surface: Surface) => Slots;
  /** Slots whose every drawn string slot holds a long sentence, and the sentences. */
  readonly longText: (sentence: (id: string) => string) => Slots;
  readonly drawnTextSlots: readonly string[];
}

/** A one-row Surface whose cells are struck through, standing in for a nested block's output. */
function styledSurface(): Surface {
  return createTextSurface('nested', { modifiers: ['strikethrough'] });
}

/** Twelve words, about 90 columns: too long for one row at width 30. */
function longSentence(id: string): string {
  return Array.from({ length: 12 }, (_, index) => `${id}${String(index + 1).padStart(2, '0')}w`).join(' ');
}

const CHOICE_REPAIR_SPECS: readonly ChoiceRepairSpec[] = [
  {
    block: textEntryBlock,
    withSurface: (surface) => ({ field: 'Search docs', value: surface, validation: '4 results' }),
    longText: (sentence) => ({ field: sentence('field'), value: sentence('value'), validation: sentence('validation') }),
    drawnTextSlots: ['field', 'value', 'validation'],
  },
  {
    block: singleChoiceBlock,
    withSurface: (surface) => ({ label: 'Output mode', options: [surface, 'pipe'], selected: 'pipe' }),
    longText: (sentence) => ({
      label: sentence('label'),
      options: [sentence('optiona'), sentence('optionb')],
      selected: sentence('optionb'),
      validation: sentence('validation'),
    }),
    drawnTextSlots: ['label', 'optiona', 'optionb', 'validation'],
  },
  {
    block: multipleChoiceBlock,
    withSurface: (surface) => ({ label: 'Release proof', checked: [surface], unchecked: ['screenshots'] }),
    longText: (sentence) => ({
      label: sentence('label'),
      checked: [sentence('checked')],
      unchecked: [sentence('unchecked')],
      validation: sentence('validation'),
    }),
    drawnTextSlots: ['label', 'checked', 'unchecked', 'validation'],
  },
  {
    block: binaryDecisionBlock,
    withSurface: (surface) => ({ label: 'Merge gate', selected: 'yes', consequence: surface }),
    longText: (sentence) => ({
      label: sentence('label'),
      selected: 'yes',
      consequence: sentence('consequence'),
      confirmation: sentence('confirmation'),
      disabledReason: sentence('disabled'),
    }),
    drawnTextSlots: ['label', 'consequence', 'confirmation', 'disabled'],
  },
];

/** The words of `text` (split at blanks and list semicolons) that the joined frame rows do not contain. */
function missingWords(text: string, rows: readonly string[]): readonly string[] {
  const drawn = rows.join(' ');
  return text.split(/[\s;]+/u).filter((word) => word !== '' && !drawn.includes(word));
}

/** `slots` with `id` replaced by an accessor property whose getter throws. */
function withThrowingGetter(slots: Slots, id: string): Slots {
  const copy: Record<string, unknown> = { ...withoutSlot(slots, id) };
  Object.defineProperty(copy, id, {
    enumerable: true,
    get: () => {
      throw new Error(`slot getter ${id} must not run`);
    },
  });
  return copy;
}

export { CHOICE_REPAIR_SPECS, longSentence, missingWords, styledSurface, withThrowingGetter };

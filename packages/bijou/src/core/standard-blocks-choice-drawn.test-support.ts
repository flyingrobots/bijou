import type { BlockDefinition, BlockRenderResult } from './block-metadata.js';
import {
  binaryDecisionBlock,
  blockRenderNode,
  multipleChoiceBlock,
  renderBlockTree,
  singleChoiceBlock,
  textEntryBlock,
} from './standard-blocks.test-support.js';
import { isSurfaceOutput } from './standard-blocks.test-support.part01.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';

type Slots = Readonly<Record<string, unknown>>;

/** What the input and choice drawing tests know about one block (flyingrobots/bijou#937). */
interface ChoiceDrawSpec {
  readonly block: BlockDefinition;
  /** The DOGFOOD example slots (`examples/docs/app-standard-block-preview-*.ts`). */
  readonly slots: Slots;
  /** The width-60 frame for `slots`, each row with trailing blanks trimmed. */
  readonly golden: readonly string[];
  /** The required slots only, and the frame they draw. */
  readonly requiredOnly: Slots;
  readonly requiredGolden: readonly string[];
  /** A required slot to drop from `slots`. */
  readonly missingSlot: string;
  readonly pipe: string;
  readonly accessible: string;
  /** Random slots within the block's schema. */
  readonly fuzz: (word: () => string, count: () => number) => Slots;
}

const TOP = `┌${'─'.repeat(58)}┐`;
const BOTTOM = `└${'─'.repeat(58)}┘`;
const inputRow = (text: string) => `${`│ ${text}`.padEnd(59)}│`;
const words = (word: () => string, count: number) => Array.from({ length: count }, word);

const CHOICE_DRAW_SPECS: readonly ChoiceDrawSpec[] = [
  {
    block: textEntryBlock,
    slots: { field: 'Search docs', value: 'table', placeholder: 'type a query', validation: '4 results', results: 4 },
    golden: ['Search docs', TOP, inputRow('table'), BOTTOM, '4 results'],
    requiredOnly: { field: 'Search docs', value: 'table' },
    requiredGolden: ['Search docs', TOP, inputRow('table'), BOTTOM],
    missingSlot: 'value',
    pipe: 'TextEntryBlock\nfield: Search docs\nvalue: table\nplaceholder: type a query\nvalidation: 4 results\nresults: 4',
    accessible: 'TextEntryBlock\nField: Search docs\nValue: table\nPlaceholder: type a query\nValidation: 4 results\nResults: 4',
    fuzz: (word, count) => ({ field: word(), value: count() % 3 === 0 ? '' : word(), placeholder: word(), validation: word(), results: count() }),
  },
  {
    block: singleChoiceBlock,
    slots: { label: 'Output mode', options: ['interactive', 'pipe', 'accessible'], selected: 'pipe', mode: 'radio', validation: 'available' },
    golden: ['Output mode', '  ○ interactive', '  ◉ pipe', '  ○ accessible', 'available'],
    requiredOnly: { label: 'Output mode', options: ['interactive', 'pipe', 'accessible'], selected: 'pipe' },
    requiredGolden: ['Output mode', '  ○ interactive', '  ◉ pipe', '  ○ accessible'],
    missingSlot: 'selected',
    pipe: 'SingleChoiceBlock\nlabel: Output mode\noptions: interactive; pipe; accessible\nselected: pipe\nmode: radio\nvalidation: available',
    accessible: 'SingleChoiceBlock\nLabel: Output mode\nOptions: interactive; pipe; accessible\nSelected: pipe\nMode: radio\nValidation: available',
    fuzz: (word, count) => {
      const options = words(word, count() % 9);
      return { label: word(), options, selected: options[count() % Math.max(1, options.length)] ?? word(), mode: word(), validation: word() };
    },
  },
  {
    block: multipleChoiceBlock,
    slots: { label: 'Release proof', checked: ['lint', 'tests'], unchecked: ['screenshots'], selected: 'lint; tests', validation: '2 of 3 complete' },
    golden: ['Release proof', '  ☑ lint', '  ☑ tests', '  ☐ screenshots', '2 of 3 complete'],
    requiredOnly: { label: 'Release proof', checked: ['lint', 'tests'], unchecked: ['screenshots'] },
    requiredGolden: ['Release proof', '  ☑ lint', '  ☑ tests', '  ☐ screenshots'],
    missingSlot: 'unchecked',
    pipe: 'MultipleChoiceBlock\nlabel: Release proof\nchecked: lint; tests\nunchecked: screenshots\nselected: lint; tests\nvalidation: 2 of 3 complete',
    accessible: 'MultipleChoiceBlock\nLabel: Release proof\nChecked: lint; tests\nUnchecked: screenshots\nSelected: lint; tests\nValidation: 2 of 3 complete',
    fuzz: (word, count) => ({ label: word(), checked: words(word, count() % 6), unchecked: words(word, count() % 6), selected: word(), validation: word() }),
  },
  {
    block: binaryDecisionBlock,
    slots: { label: 'Merge gate', selected: 'yes', consequence: 'admin merge', confirmation: 'CI green', disabledReason: 'none' },
    golden: ['Merge gate', '  ◉ yes  ○ no', '→ admin merge', '✓ CI green', '⊘ none'],
    requiredOnly: { label: 'Merge gate', selected: 'yes', consequence: 'admin merge' },
    requiredGolden: ['Merge gate', '  ◉ yes  ○ no', '→ admin merge'],
    missingSlot: 'consequence',
    pipe: 'BinaryDecisionBlock\nlabel: Merge gate\nselected: yes\nconsequence: admin merge\nconfirmation: CI green\ndisabledReason: none',
    accessible: 'BinaryDecisionBlock\nLabel: Merge gate\nSelected: yes\nConsequence: admin merge\nConfirmation: CI green\nDisabled reason: none',
    fuzz: (word, count) => ({ label: word(), selected: ['yes', 'no', word()][count() % 3], consequence: word(), confirmation: word(), disabledReason: word() }),
  },
];

function drawResult(block: BlockDefinition, slots: Slots, width = 60): BlockRenderResult {
  return renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width } }));
}

function drawBlock(block: BlockDefinition, slots: Slots, width = 60): DrawnFrame {
  return drawnFrame(drawResult(block, slots, width));
}

/** The text modifiers of the drawn cell at column `x`, row `y`. */
function cellModifiers(result: BlockRenderResult, x: number, y: number): readonly string[] {
  if (!isSurfaceOutput(result)) throw new Error('interactive output is not a Surface');
  const cell: object = result.output.get(x, y);
  const modifiers = 'modifiers' in cell ? cell.modifiers : undefined;
  return Array.isArray(modifiers) ? modifiers.filter((item): item is string => typeof item === 'string') : [];
}

function trimmedRows(frame: DrawnFrame): readonly string[] {
  return frame.rows.map((row) => row.trimEnd());
}

function withoutSlot(slots: Slots, id: string): Slots {
  return Object.fromEntries(Object.entries(slots).filter(([key]) => key !== id));
}

/** A deterministic linear congruential generator, so fuzz runs repeat exactly. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state;
  };
}

/** Untrusted slot text the drawers must sanitize: an SGR colour sequence. It is test data, not styling. */
const SGR_RED = `${String.fromCharCode(0x1b)}[31m`;

/** Narrow printable text, plus the control bytes and line breaks a slot value may carry. */
const FUZZ_PIECES = ['a', 'Z', '7', ' ', '-', '─', '◉', '☑', 'é', '\n', '\t', SGR_RED, '\u0007', ';'];

function fuzzWord(next: () => number): () => string {
  return () => Array.from({ length: next() % 150 }, () => FUZZ_PIECES[next() % FUZZ_PIECES.length] ?? 'a').join('');
}

/** Whether `text` holds a C0 control character or DEL. */
function hasControlCharacter(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export type { ChoiceDrawSpec, Slots };
export { CHOICE_DRAW_SPECS, cellModifiers, drawBlock, drawResult, fuzzWord, hasControlCharacter, seededRandom, trimmedRows, withoutSlot };

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sha256Hex, type UcdInput } from './east-asian-width.js';

/** One code point's UCD facts used by the width report. */
export interface CodePointFacts {
  readonly eastAsianWidth: string;
  readonly generalCategory: string;
}

/** The parsed UCD inputs of the width report. */
export interface WidthUcd {
  readonly inputs: readonly UcdInput[];
  /** Every assigned code point (General_Category not Cn, Cs or Co). */
  readonly assigned: ReadonlyMap<number, CodePointFacts>;
  readonly blockOf: (cp: number) => string;
  /** Code point sequences of every line of emoji-test.txt. */
  readonly emojiSequences: readonly string[];
}

const RANGE = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*([^#]+?)\s*(?:#\s*(\S+).*)?$/u;
const UNASSIGNED = new Set(['Cn', 'Cs', 'Co']);

function readInput(root: string, path: string, inputs: UcdInput[]): string {
  const bytes = readFileSync(resolve(root, path));
  inputs.push({ path, sha256: sha256Hex(bytes) });
  return bytes.toString('utf8');
}

function* ranges(text: string): Generator<readonly [number, number, string, string]> {
  for (const line of text.split('\n')) {
    const match = RANGE.exec(line);
    if (match?.[1] === undefined || match[3] === undefined) continue;
    const first = parseInt(match[1], 16);
    yield [first, parseInt(match[2] ?? match[1], 16), match[3], match[4] ?? ''];
  }
}

/** Read EastAsianWidth.txt, Blocks.txt and emoji-test.txt from `directory`. */
export function readWidthUcd(root: string, directory: string): WidthUcd {
  const inputs: UcdInput[] = [];
  const assigned = new Map<number, CodePointFacts>();
  const eaw = readInput(root, `${directory}/EastAsianWidth.txt`, inputs);
  for (const [first, last, eastAsianWidth, generalCategory] of ranges(eaw)) {
    if (UNASSIGNED.has(generalCategory)) continue;
    for (let cp = first; cp <= last; cp += 1) assigned.set(cp, { eastAsianWidth, generalCategory });
  }
  const blocks = [...ranges(readInput(root, `${directory}/Blocks.txt`, inputs))];
  const blockOf = (cp: number): string => {
    const block = blocks.find(([first, last]) => cp >= first && cp <= last);
    return block === undefined ? 'No_Block' : block[2];
  };
  const emojiSequences: string[] = [];
  for (const line of readInput(root, `${directory}/emoji-test.txt`, inputs).split('\n')) {
    const match = /^([0-9A-F ]+);/u.exec(line);
    if (match?.[1] === undefined) continue;
    const cps = match[1].trim().split(/\s+/u).map((part) => parseInt(part, 16));
    emojiSequences.push(String.fromCodePoint(...cps));
  }
  return { inputs, assigned, blockOf, emojiSequences };
}

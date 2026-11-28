import { createTextSurface } from './components/surface-text.js';
import { describe, expect, findCell, isSurfaceOutput, it, progressiveDisclosureBlock } from './standard-blocks.test-support.js';
import { drawnFrame } from './standard-blocks-drawn.test-support.js';
import { DISCLOSURE, NAVIGATION_CASES, drawFrame, type Slots } from './standard-blocks-navigation.test-support.js';

const NESTED_SLOT: Readonly<Record<string, string>> = {
  PeerNavigationBlock: 'current',
  PathProgressBlock: 'path',
  ProgressiveDisclosureBlock: 'label',
  LinkDestinationBlock: 'label',
};

/** Slots whose text a drawing shows as a mark or keeps hidden, so they are not checked word by word. */
const NOT_SHOWN_AS_TEXT: Readonly<Record<string, readonly string[]>> = {
  ProgressiveDisclosureBlock: ['state', 'details'],
};

const LONG_WORDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india'];

/** A sentence wider than the narrowest row whose words name `tag`, so each slot's words are distinct. */
function taggedWords(tag: string): string {
  return LONG_WORDS.map((word) => `${tag}.${word}`).join(' ');
}

function slotWords(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => slotWords(item));
  if (typeof value === 'string' || typeof value === 'number') return String(value).split(/\s+/u).filter(Boolean);
  return [];
}

/** Each text slot replaced by a sentence longer than the narrowest row; tokens and numbers kept. */
function longSlots(slots: Slots): Slots {
  return Object.fromEntries(Object.entries(slots).map(([key, value]) => {
    if (key === 'state' || typeof value === 'number') return [key, value];
    if (Array.isArray(value)) return [key, value.map((_, index) => taggedWords(`${key}${String(index)}`))];
    return [key, taggedWords(key)];
  }));
}

function missingWords(blockName: string, slots: Slots, text: string): string[] {
  const hidden = NOT_SHOWN_AS_TEXT[blockName] ?? [];
  return Object.entries(slots)
    .filter(([key]) => !hidden.includes(key))
    .flatMap(([, value]) => slotWords(value))
    .filter((word) => !text.includes(word));
}

/** `slots` with `key` defined as an accessor that throws when read. */
function withThrowingGetter(slots: Slots, key: string): Slots {
  const copy: Record<string, unknown> = Object.fromEntries(Object.entries(slots).filter(([name]) => name !== key));
  Object.defineProperty(copy, key, { enumerable: true, get: () => { throw new Error(`read ${key}`); } });
  return copy;
}

describe.each(NAVIGATION_CASES)('$block.metadata.blockName repair contract (flyingrobots/bijou#938)', (testCase) => {
  const { block, slots } = testCase;
  const name = block.metadata.blockName;

  it('R1: blits a Surface-valued slot cell by cell, keeping its styling', () => {
    const nested = createTextSurface('nested', { fg: '#ff0000', modifiers: ['bold'] });
    const frame = block.render({ mode: 'interactive', slots: { ...slots, [NESTED_SLOT[name] ?? 'label']: nested }, config: { width: 60 } });
    if (!isSurfaceOutput(frame)) throw new Error('interactive output is not a Surface');

    expect(findCell(frame.output, 'n')).toEqual(nested.get(0, 0));
    expect(findCell(frame.output, 'd')).toEqual(nested.get(5, 0));
  });

  it.each([30, 60])('R2: shows every word of the DOGFOOD slots at width %i', (width) => {
    expect(missingWords(name, slots, drawFrame(block, slots, width).rows.join(' '))).toEqual([]);
  });

  it('R2: wraps long slot text at width 30 instead of cutting it', () => {
    const long = longSlots(slots);
    const frame = drawFrame(block, long, 30);

    expect(frame.rows.every((row) => row.length === 30)).toBe(true);
    expect(missingWords(name, long, frame.rows.join(' '))).toEqual([]);
  });

  it('R2: shows the whole missing-slot text at width 30', () => {
    const rest = Object.fromEntries(Object.entries(slots).filter(([key]) => key !== testCase.required));
    const text = drawFrame(block, rest, 30).rows.join(' ');

    expect(slotWords(`(missing required ${testCase.required})`).filter((word) => !text.includes(word))).toEqual([]);
  });

  it('R3: never reads a slot through a throwing accessor when rendered directly', () => {
    for (const key of Object.keys(slots)) {
      const text = drawnFrame(block.render({ mode: 'interactive', slots: withThrowingGetter(slots, key), config: { width: 60 } })).rows.join('\n');
      if (key === testCase.required) expect(text).toContain(`(missing required ${key})`);
    }
  });
});

describe('ProgressiveDisclosure repair contract details (flyingrobots/bijou#938)', () => {
  it('R2: wraps long open details at width 30 instead of cutting them', () => {
    const long: Slots = { ...longSlots(DISCLOSURE), state: 'open' };
    const text = drawFrame(progressiveDisclosureBlock, long, 30).rows.join(' ');

    expect(slotWords(long['details']).filter((word) => !text.includes(word))).toEqual([]);
  });

  it('R3: never reads open details through a throwing accessor', () => {
    const slots = withThrowingGetter({ ...DISCLOSURE, state: 'open' }, 'details');

    expect(drawnFrame(progressiveDisclosureBlock.render({ mode: 'interactive', slots, config: { width: 60 } })).rows[0])
      .toContain('▼ Advanced options');
  });

  it('R1: blits Surface-valued details on their own indented rows', () => {
    const nested = createTextSurface('nested', { fg: '#00ff00' });
    const slots = { ...DISCLOSURE, state: 'open', details: [nested] };
    const frame = progressiveDisclosureBlock.render({ mode: 'interactive', slots, config: { width: 60 } });

    expect(drawnFrame(frame).rows[1]).toBe('  nested'.padEnd(60));
    if (!isSurfaceOutput(frame)) throw new Error('interactive output is not a Surface');
    expect(frame.output.get(2, 1)).toEqual(nested.get(0, 0));
  });
});

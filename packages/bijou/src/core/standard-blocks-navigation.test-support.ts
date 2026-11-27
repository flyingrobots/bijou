import { createTestContext, _resetDefaultContextForTesting } from '../adapters/test/index.js';
import { setDefaultContext } from '../context.js';
import type { BlockDefinition } from './block-metadata.js';
import {
  blockRenderNode,
  linkDestinationBlock,
  pathProgressBlock,
  peerNavigationBlock,
  progressiveDisclosureBlock,
  renderBlockTree,
} from './standard-blocks.test-support.js';
import { drawnFrame, type DrawnFrame } from './standard-blocks-drawn.test-support.js';

type Slots = Readonly<Record<string, unknown>>;

/** One navigation block with its DOGFOOD example slots and its pinned pipe and accessible text. */
interface NavigationCase {
  readonly block: BlockDefinition;
  readonly slots: Slots;
  readonly required: string;
  readonly optional: readonly string[];
  readonly pipe: string;
  readonly accessible: string;
}

const PEER: Slots = { previous: 'Architecture', current: 'Blocks', next: 'Method', route: 'docs/blocks', status: 'available' };
const PATH: Slots = { path: ['Setup', 'Blocks', 'Preview'], current: 'Blocks', step: 2, total: 3, status: 'current' };
const DISCLOSURE: Slots = {
  label: 'Advanced options', state: 'closed', hiddenCount: 6, summary: '6 options hidden', details: ['debug traces', 'layout facts'],
};
const LINK: Slots = { label: 'DOGFOOD.md', destination: 'docs/DOGFOOD.md', kind: 'docs', status: 'available' };

const NAVIGATION_CASES: readonly NavigationCase[] = [
  {
    block: peerNavigationBlock, slots: PEER, required: 'previous', optional: ['route', 'status'],
    pipe: 'PeerNavigationBlock\nprevious: Architecture\ncurrent: Blocks\nnext: Method\nroute: docs/blocks\nstatus: available',
    accessible: 'PeerNavigationBlock\nPrevious: Architecture\nCurrent: Blocks\nNext: Method\nRoute: docs/blocks\nStatus: available',
  },
  {
    block: pathProgressBlock, slots: PATH, required: 'current', optional: ['status'],
    pipe: 'PathProgressBlock\npath: Setup; Blocks; Preview\ncurrent: Blocks\nstep: 2\ntotal: 3\nstatus: current',
    accessible: 'PathProgressBlock\nPath: Setup; Blocks; Preview\nCurrent: Blocks\nStep: 2\nTotal: 3\nStatus: current',
  },
  {
    block: progressiveDisclosureBlock, slots: DISCLOSURE, required: 'hiddenCount', optional: ['summary', 'details'],
    pipe: 'ProgressiveDisclosureBlock\nlabel: Advanced options\nstate: closed\nhiddenCount: 6\nsummary: 6 options hidden\ndetails: debug traces; layout facts',
    accessible: 'ProgressiveDisclosureBlock\nLabel: Advanced options\nState: closed\nHidden count: 6\nSummary: 6 options hidden\nDetails: debug traces; layout facts',
  },
  {
    block: linkDestinationBlock, slots: LINK, required: 'destination', optional: ['kind', 'status'],
    pipe: 'LinkDestinationBlock\nlabel: DOGFOOD.md\ndestination: docs/DOGFOOD.md\nkind: docs\nstatus: available',
    accessible: 'LinkDestinationBlock\nLabel: DOGFOOD.md\nDestination: docs/DOGFOOD.md\nKind: docs\nStatus: available',
  },
];

/** The `interactive` frame of `block` drawn from `slots` at `width`. */
function drawFrame(block: BlockDefinition, slots: Slots, width = 60): DrawnFrame {
  return drawnFrame(renderBlockTree(blockRenderNode(block, { mode: 'interactive', slots, config: { width } })));
}

/** `slots` without the named keys. */
function without(slots: Slots, keys: readonly string[]): Slots {
  return Object.fromEntries(Object.entries(slots).filter(([key]) => !keys.includes(key)));
}

/** Runs `draw` with a right-to-left default context, then clears the default context. */
function underRightToLeft<T>(draw: () => T): T {
  setDefaultContext(createTestContext({ direction: 'rtl' }));
  try {
    return draw();
  } finally {
    _resetDefaultContextForTesting();
  }
}

/** A deterministic linear congruential generator. */
function seededRandom(seed: number): (limit: number) => number {
  let state = seed;
  return (limit) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % limit;
  };
}

const HOSTILE = ['\x1b[31m', '\n', '\t', '\x07', ' ', '·'];

/** Random terminal text: letters and spaces mixed with control bytes, up to 90 characters. */
function randomText(next: (limit: number) => number): string {
  let text = '';
  const length = next(90);
  for (let index = 0; index < length; index += 1) {
    text += next(8) === 0 ? (HOSTILE[next(HOSTILE.length)] ?? ' ') : String.fromCharCode(97 + next(26));
  }
  return text;
}

/** Random slots for `block`: text or text lists per its schema, each optional slot kept half the time. */
function randomSlots(testCase: NavigationCase, next: (limit: number) => number): Slots {
  const slots: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(testCase.slots)) {
    if (testCase.optional.includes(key) && next(2) === 0) continue;
    if (Array.isArray(value)) slots[key] = Array.from({ length: next(7) }, () => randomText(next));
    else if (typeof value === 'number') slots[key] = next(1000);
    else if (key === 'state') slots[key] = ['open', 'closed', randomText(next)][next(3)];
    else slots[key] = randomText(next);
  }
  return slots;
}

export type { NavigationCase, Slots };
export { DISCLOSURE, LINK, NAVIGATION_CASES, PATH, PEER, drawFrame, randomSlots, seededRandom, underRightToLeft, without };

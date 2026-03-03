import { describe, it, expect } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { DagNode } from '@flyingrobots/bijou';
import type { KeyMsg } from './types.js';
import {
  createDagPaneState,
  dagPane,
  dagPaneSelectChild,
  dagPaneSelectParent,
  dagPaneSelectLeft,
  dagPaneSelectRight,
  dagPaneSelectNode,
  dagPaneClearSelection,
  dagPaneScrollBy,
  dagPaneScrollToTop,
  dagPaneScrollToBottom,
  dagPanePageDown,
  dagPanePageUp,
  dagPaneScrollByX,
  dagPaneSetSource,
  dagPaneKeyMap,
} from './dag-pane.js';

// ── Test Data ──────────────────────────────────────────────────────

/** Simple linear chain: A → B → C */
const LINEAR_NODES: DagNode[] = [
  { id: 'A', label: 'Alpha', edges: ['B'] },
  { id: 'B', label: 'Beta', edges: ['C'] },
  { id: 'C', label: 'Gamma' },
];

/** Diamond graph: A → B, A → C, B → D, C → D */
const DIAMOND_NODES: DagNode[] = [
  { id: 'A', label: 'Root', edges: ['B', 'C'] },
  { id: 'B', label: 'Left', edges: ['D'] },
  { id: 'C', label: 'Right', edges: ['D'] },
  { id: 'D', label: 'Merge' },
];

/** Wide graph with multiple roots and siblings in same layer */
const WIDE_NODES: DagNode[] = [
  { id: 'R1', label: 'Root 1', edges: ['C1', 'C2'] },
  { id: 'R2', label: 'Root 2', edges: ['C3'] },
  { id: 'C1', label: 'Child 1' },
  { id: 'C2', label: 'Child 2' },
  { id: 'C3', label: 'Child 3' },
];

const ctx = createTestContext();

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
}

// ── createDagPaneState ────────────────────────────────────────────

describe('createDagPaneState', () => {
  it('creates state with no selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.selectedId).toBeUndefined();
    expect(state.highlightPath).toEqual([]);
  });

  it('caches layout', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.layout.output).toBeTruthy();
    expect(state.layout.nodes.size).toBe(3);
  });

  it('creates focusArea state', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.focusArea.width).toBe(60);
    expect(state.focusArea.height).toBe(20);
  });

  it('allows initial selectedId', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    expect(state.selectedId).toBe('B');
    expect(state.highlightPath.length).toBeGreaterThan(0);
  });

  it('defaults overflowX to scroll (DAGs are wide)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.focusArea.overflowX).toBe('scroll');
  });

  it('stores source reference', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.source).toBe(LINEAR_NODES);
  });
});

// ── Arrow key navigation ──────────────────────────────────────────

describe('dagPaneSelectChild (arrow down)', () => {
  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBeDefined();
    // Should select a root node (A in the linear chain)
    expect(next.selectedId).toBe('A');
  });

  it('moves to child node', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBe('B');
  });

  it('stays on leaf node (no children)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('updates highlight path', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectChild(state, ctx);
    expect(next.highlightPath).toContain('A');
    expect(next.highlightPath).toContain('B');
  });
});

describe('dagPaneSelectParent (arrow up)', () => {
  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });

  it('moves to parent node', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });

  it('stays on root node (no parents)', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    const next = dagPaneSelectParent(state, ctx);
    expect(next.selectedId).toBe('A');
  });
});

describe('dagPaneSelectLeft / dagPaneSelectRight (siblings)', () => {
  it('moves left among siblings in same layer', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectLeft(state, ctx);
    // B and C are in the same layer — moving left should go to B
    // (B has smaller col position)
    expect(next.selectedId).toBe('B');
  });

  it('moves right among siblings in same layer', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectRight(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('stays at left edge (no more siblings)', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSelectLeft(state, ctx);
    // B is already leftmost in its layer
    expect(next.selectedId).toBe('B');
  });

  it('stays at right edge (no more siblings)', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'C', ctx });
    const next = dagPaneSelectRight(state, ctx);
    expect(next.selectedId).toBe('C');
  });

  it('auto-selects first root when nothing is selected', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectLeft(state, ctx);
    expect(next.selectedId).toBe('A');
  });
});

// ── Direct selection ──────────────────────────────────────────────

describe('dagPaneSelectNode', () => {
  it('selects a specific node by ID', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    expect(next.selectedId).toBe('C');
  });

  it('computes highlight path to root', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    expect(next.highlightPath).toContain('A');
    expect(next.highlightPath).toContain('B');
    expect(next.highlightPath).toContain('C');
  });

  it('ignores unknown node IDs', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSelectNode(state, 'UNKNOWN', ctx);
    expect(next.selectedId).toBeUndefined();
  });
});

describe('dagPaneClearSelection', () => {
  it('clears the selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneClearSelection(state, ctx);
    expect(next.selectedId).toBeUndefined();
    expect(next.highlightPath).toEqual([]);
  });
});

// ── Auto-highlight path ───────────────────────────────────────────

describe('auto-highlight path', () => {
  it('path includes root to selected node in linear chain', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'C', ctx });
    expect(state.highlightPath).toEqual(['A', 'B', 'C']);
  });

  it('path is single node for root selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'A', ctx });
    expect(state.highlightPath).toEqual(['A']);
  });

  it('path follows one branch in diamond graph', () => {
    const state = createDagPaneState({ source: DIAMOND_NODES, width: 80, height: 20, selectedId: 'D', ctx });
    // Should find a path from A through either B or C to D
    expect(state.highlightPath[0]).toBe('A');
    expect(state.highlightPath[state.highlightPath.length - 1]).toBe('D');
    expect(state.highlightPath.length).toBe(3); // A → B|C → D
  });

  it('empty path when no selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    expect(state.highlightPath).toEqual([]);
  });
});

// ── Scroll transformers ───────────────────────────────────────────

describe('dagPaneScrollBy', () => {
  it('scrolls viewport vertically', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneScrollBy(state, 2);
    expect(next.focusArea.scroll.y).toBe(2);
  });
});

describe('dagPaneScrollToTop / dagPaneScrollToBottom', () => {
  it('scrolls to top', () => {
    let state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    state = dagPaneScrollBy(state, 5);
    const next = dagPaneScrollToTop(state);
    expect(next.focusArea.scroll.y).toBe(0);
  });

  it('scrolls to bottom', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneScrollToBottom(state);
    expect(next.focusArea.scroll.y).toBe(state.focusArea.scroll.maxY);
  });
});

describe('dagPanePageDown / dagPanePageUp', () => {
  it('pages down', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPanePageDown(state);
    expect(next.focusArea.scroll.y).toBeGreaterThanOrEqual(0);
  });

  it('pages up', () => {
    let state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    state = dagPaneScrollBy(state, 10);
    const next = dagPanePageUp(state);
    expect(next.focusArea.scroll.y).toBeLessThan(state.focusArea.scroll.y);
  });
});

describe('dagPaneScrollByX', () => {
  it('scrolls horizontally', () => {
    const state = createDagPaneState({ source: WIDE_NODES, width: 40, height: 20, ctx });
    const next = dagPaneScrollByX(state, 5);
    expect(next.focusArea.scroll.x).toBe(5);
  });
});

// ── dagPaneSetSource ──────────────────────────────────────────────

describe('dagPaneSetSource', () => {
  it('updates source and re-renders layout', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const next = dagPaneSetSource(state, DIAMOND_NODES, ctx);
    expect(next.source).toBe(DIAMOND_NODES);
    expect(next.layout.nodes.size).toBe(4);
  });

  it('clears selection', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, selectedId: 'B', ctx });
    const next = dagPaneSetSource(state, DIAMOND_NODES, ctx);
    expect(next.selectedId).toBeUndefined();
    expect(next.highlightPath).toEqual([]);
  });
});

// ── Render ─────────────────────────────────────────────────────────

describe('dagPane', () => {
  it('renders a string', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 20, ctx });
    const output = dagPane(state, { ctx });
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('renders exactly height lines', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx });
    const output = dagPane(state, { ctx });
    expect(output.split('\n')).toHaveLength(10);
  });

  it('includes gutter in interactive mode', () => {
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx });
    const output = dagPane(state, { ctx });
    expect(output).toContain('▎');
  });

  it('pipe mode omits gutter', () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 10, ctx: pipeCtx });
    const output = dagPane(state, { ctx: pipeCtx });
    expect(output).not.toContain('▎');
  });
});

// ── Auto-scroll to selection ──────────────────────────────────────

describe('auto-scroll to selection', () => {
  it('scrolls to bring selected node into view', () => {
    // Use a small viewport height to ensure the last node in a tall graph
    // is outside the initial viewport
    const state = createDagPaneState({ source: LINEAR_NODES, width: 60, height: 5, ctx });
    const next = dagPaneSelectNode(state, 'C', ctx);
    // The node C is in the last layer, which starts well below row 0
    const nodePos = next.layout.nodes.get('C');
    if (nodePos) {
      // Scroll should have adjusted so the node is within the viewport
      const scrollY = next.focusArea.scroll.y;
      expect(scrollY).toBeLessThanOrEqual(nodePos.row);
      expect(scrollY + next.focusArea.height).toBeGreaterThanOrEqual(nodePos.row);
    }
  });
});

// ── Keymap ──────────────────────────────────────────────────────────

describe('dagPaneKeyMap', () => {
  type Msg = { type: string };

  const km = dagPaneKeyMap<Msg>({
    selectParent: { type: 'parent' },
    selectChild: { type: 'child' },
    selectLeft: { type: 'left' },
    selectRight: { type: 'right' },
    scrollUp: { type: 'up' },
    scrollDown: { type: 'down' },
    scrollLeft: { type: 'sleft' },
    scrollRight: { type: 'sright' },
    pageUp: { type: 'pu' },
    pageDown: { type: 'pd' },
    top: { type: 'top' },
    bottom: { type: 'bot' },
    confirm: { type: 'ok' },
    quit: { type: 'quit' },
  });

  it('handles arrow keys for node selection', () => {
    expect(km.handle(keyMsg('up'))).toEqual({ type: 'parent' });
    expect(km.handle(keyMsg('down'))).toEqual({ type: 'child' });
    expect(km.handle(keyMsg('left'))).toEqual({ type: 'left' });
    expect(km.handle(keyMsg('right'))).toEqual({ type: 'right' });
  });

  it('handles j/k for scroll', () => {
    expect(km.handle(keyMsg('j'))).toEqual({ type: 'down' });
    expect(km.handle(keyMsg('k'))).toEqual({ type: 'up' });
  });

  it('handles h/l for horizontal scroll', () => {
    expect(km.handle(keyMsg('h'))).toEqual({ type: 'sleft' });
    expect(km.handle(keyMsg('l'))).toEqual({ type: 'sright' });
  });

  it('handles page keys', () => {
    expect(km.handle(keyMsg('d'))).toEqual({ type: 'pd' });
    expect(km.handle(keyMsg('u'))).toEqual({ type: 'pu' });
  });

  it('handles top/bottom', () => {
    expect(km.handle(keyMsg('g'))).toEqual({ type: 'top' });
    expect(km.handle(keyMsg('g', { shift: true }))).toEqual({ type: 'bot' });
  });

  it('handles enter for confirm', () => {
    expect(km.handle(keyMsg('return'))).toEqual({ type: 'ok' });
  });

  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toEqual({ type: 'quit' });
    expect(km.handle(keyMsg('c', { ctrl: true }))).toEqual({ type: 'quit' });
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});

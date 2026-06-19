import { describe, it, expect } from 'vitest';
import { dag, dagSlice } from './dag.js';
import type { DagNode } from './dag.js';
import { arraySource } from './dag-source.js';
import { auditStyle, createTestContext, type StyledCall } from '../../adapters/test/index.js';
import type { TokenValue } from '../theme/tokens.js';

// ── Test Data ──────────────────────────────────────────────────────

const twoNodes: DagNode[] = [
  { id: 'a', label: 'Alpha', edges: ['b'] },
  { id: 'b', label: 'Beta' },
];

const diamond: DagNode[] = [
  { id: 'a', label: 'Start', edges: ['b', 'c'] },
  { id: 'b', label: 'Left', edges: ['d'] },
  { id: 'c', label: 'Right', edges: ['d'] },
  { id: 'd', label: 'End' },
];

const linear: DagNode[] = [
  { id: 'a', label: 'First', edges: ['b'] },
  { id: 'b', label: 'Second', edges: ['c'] },
  { id: 'c', label: 'Third' },
];

const fanOut: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b', 'c', 'd'] },
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
  { id: 'd', label: 'D' },
];

const withBadges: DagNode[] = [
  { id: 'a', label: 'Build', edges: ['b'], badge: 'DONE' },
  { id: 'b', label: 'Test', edges: ['c'], badge: 'WIP' },
  { id: 'c', label: 'Deploy', badge: 'BLOCKED' },
];

const largeGraph: DagNode[] = [
  { id: 'root', label: 'Root', edges: ['a', 'b'] },
  { id: 'a', label: 'A', edges: ['c', 'd'] },
  { id: 'b', label: 'B', edges: ['d', 'e'] },
  { id: 'c', label: 'C', edges: ['f'] },
  { id: 'd', label: 'D', edges: ['f'] },
  { id: 'e', label: 'E', edges: ['f'] },
  { id: 'f', label: 'F' },
];

function styledCallMatches(call: StyledCall, token: TokenValue, text: string): boolean {
  if (call.method !== 'styled' || call.token == null) return false;
  return call.token.hex === token.hex && call.token.bg === token.bg && call.text.includes(text);
}

// ── Basic Tests ────────────────────────────────────────────────────

describe('render output stability', () => {
  it('two-node linear graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(twoNodes, { ctx });
    // Capture the exact output to detect regressions during refactoring.
    // If the rendering algorithm changes, update this snapshot deliberately.
    expect(output).toMatchSnapshot();
  });

  it('diamond graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(diamond, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('linear chain snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(linear, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('fan-out graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200 } });
    const output = dag(fanOut, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('badges graph snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(withBadges, { ctx });
    expect(output).toMatchSnapshot();
  });

  it('single node snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag([{ id: 'a', label: 'Only' }], { ctx });
    expect(output).toMatchSnapshot();
  });

  it('highlighted path snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(diamond, {
      highlightPath: ['a', 'b', 'd'],
      highlightToken: { hex: '#ff0000' },
      ctx,
    });
    expect(output).toMatchSnapshot();
  });

  it('selected node snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const output = dag(twoNodes, { selectedId: 'a', ctx });
    expect(output).toMatchSnapshot();
  });

  it('ghost nodes snapshot', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const sliced = dagSlice(largeGraph, 'd', { direction: 'ancestors', depth: 1 });
    const output = dag(sliced, { ctx });
    expect(output).toMatchSnapshot();
  });
});
// ── labelToken / badgeToken Tests ──────────────────────────────────
describe('DagNode labelToken / badgeToken', () => {
  it('labelToken renders node without error', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      { id: 'a', label: 'Alpha', labelToken: { hex: '#00ff00' } },
    ];
    const result = dag(nodes, { ctx });
    expect(result).toContain('Alpha');
    expect(result).toContain('╭');
  });
  it('badgeToken colors badge differently from border', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      { id: 'a', label: 'Build', badge: 'DONE', badgeToken: { hex: '#ff0000' } },
    ];
    const result = dag(nodes, { ctx });
    expect(result).toContain('Build');
    expect(result).toContain('DONE');
  });
  it('both labelToken and badgeToken together', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'Deploy',
        badge: 'WIP',
        labelToken: { hex: '#00ff00' },
        badgeToken: { hex: '#ff0000' },
      },
    ];
    const result = dag(nodes, { ctx });
    expect(result).toContain('Deploy');
    expect(result).toContain('WIP');
  });
  it('falls back to node token when labelToken/badgeToken omitted', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'Deploy',
        badge: 'OK',
        token: { hex: '#0000ff' },
        // no labelToken/badgeToken — should use token for all chars
      },
    ];
    const src = arraySource(nodes);
    // arraySource should return undefined for missing token overrides
    expect(src.labelToken?.('a')).toBeUndefined();
    expect(src.badgeToken?.('a')).toBeUndefined();
    // Should still render without error using the base token
    const result = dag(nodes, { ctx });
    expect(result).toContain('Deploy');
    expect(result).toContain('OK');
  });
  it('works with selectedId — selectedToken takes precedence for border', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'Selected',
        labelToken: { hex: '#00ff00' },
        badgeToken: { hex: '#ff0000' },
        badge: 'TAG',
      },
    ];
    // Should not crash and should render
    const result = dag(nodes, { selectedId: 'a', ctx });
    expect(result).toContain('Selected');
    expect(result).toContain('TAG');
  });
  it('works through arraySource', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'A',
        edges: ['b'],
        labelToken: { hex: '#00ff00' },
        bgToken: { hex: '#111111', bg: '#222222' },
        compactShape: 'round',
      },
      { id: 'b', label: 'B', badgeToken: { hex: '#ff0000' }, badge: 'X' },
    ];
    const src = arraySource(nodes);
    expect(src.bgToken?.('a')).toEqual({ hex: '#111111', bg: '#222222' });
    expect(src.compactShape?.('a')).toBe('round');
    expect(src.labelToken?.('a')).toEqual({ hex: '#00ff00' });
    expect(src.badgeToken?.('b')).toEqual({ hex: '#ff0000' });
    expect(src.labelToken?.('b')).toBeUndefined();
    expect(src.badgeToken?.('a')).toBeUndefined();
    const result = dag(src, { nodeStyle: 'compact', nodeWidth: 3, ctx });
    expect(result).toContain('(A)');
    expect(result).toContain('B');
  });
  it('works through dagSlice', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120 } });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'A',
        edges: ['b'],
        labelToken: { hex: '#00ff00' },
        bgToken: { hex: '#111111', bg: '#222222' },
        compactShape: 'round',
      },
      { id: 'b', label: 'B', edges: ['c'], badgeToken: { hex: '#ff0000' }, badge: 'X' },
      { id: 'c', label: 'C' },
    ];
    const src = arraySource(nodes);
    const sliced = dagSlice(src, 'b', { direction: 'both', depth: 1 });
    // labelToken should be preserved for 'a'
    expect(sliced.labelToken?.('a')).toEqual({ hex: '#00ff00' });
    expect(sliced.bgToken?.('a')).toEqual({ hex: '#111111', bg: '#222222' });
    expect(sliced.compactShape?.('a')).toBe('round');
    // badgeToken should be preserved for 'b'
    expect(sliced.badgeToken?.('b')).toEqual({ hex: '#ff0000' });
    const result = dag(sliced, { nodeStyle: 'compact', nodeWidth: 3, ctx });
    expect(result).toContain('(A)');
    expect(result).toContain('B');
  });
  it('styles node border, background, label, badge, and edges independently in interactive mode', () => {
    const style = auditStyle();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 80 }, style });
    const borderToken = { hex: '#111111' };
    const bgToken = { hex: '#222222', bg: '#101010' };
    const labelToken = { hex: '#33cc33' };
    const badgeToken = { hex: '#ff5555' };
    const edgeToken = { hex: '#4488ff' };
    const result = dag([
      {
        id: 'a',
        label: 'Build',
        badge: 'HOT',
        edges: ['b'],
        labelToken,
        badgeToken,
      },
      { id: 'b', label: 'Ship' },
    ], {
      nodeToken: borderToken,
      nodeBgToken: bgToken,
      edgeToken,
      ctx,
    });
    expect(result).toContain('Build');
    expect(result).toContain('HOT');
    expect(style.calls.some(
      (call) => styledCallMatches(call, { ...borderToken, bg: bgToken.bg }, '╭'),
    )).toBe(true);
    expect(style.calls.some(
      (call) => styledCallMatches(call, { ...labelToken, bg: bgToken.bg }, 'Build'),
    )).toBe(true);
    expect(style.calls.some(
      (call) => styledCallMatches(call, { ...badgeToken, bg: bgToken.bg }, 'HOT'),
    )).toBe(true);
    expect(style.calls.some(
      (call) => styledCallMatches(call, bgToken, ' '),
    )).toBe(true);
    expect(style.calls.some(
      (call) => call.method === 'styled'
        && call.token?.hex === edgeToken.hex
        && /[│▼]/.test(call.text),
    )).toBe(true);
  });
  it('pipe mode ignores tokens (no ANSI output)', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const nodes: DagNode[] = [
      {
        id: 'a',
        label: 'Build',
        badge: 'OK',
        labelToken: { hex: '#00ff00' },
        badgeToken: { hex: '#ff0000' },
        edges: ['b'],
      },
      { id: 'b', label: 'Test' },
    ];
    const result = dag(nodes, { ctx });
    // Pipe mode uses plain text adjacency list — no ANSI
    expect(result).not.toContain('\x1b[');
    expect(result).toContain('Build (OK) -> Test');
  });
});

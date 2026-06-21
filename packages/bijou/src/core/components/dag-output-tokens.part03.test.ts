import { describe, it, expect } from 'vitest';
import { dag } from './dag.js';
import type { DagNode } from './dag.js';
import { auditStyle, createTestContext, type StyledCall } from '../../adapters/test/index.js';
import type { TokenValue } from '../theme/tokens.js';

function styledCallMatches(call: StyledCall, token: TokenValue, text: string): boolean {
  if (call.method !== 'styled' || call.token == null) return false;
  return call.token.hex === token.hex && call.token.bg === token.bg && call.text.includes(text);
}

describe('DagNode labelToken / badgeToken', () => {
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

import { describe, expect, it } from 'vitest';
import {
  collectTokenDependents,
  collectTransitiveTokenDependents,
  createTokenGraph,
} from '@flyingrobots/bijou';

describe('TokenValue background dependency provenance', () => {
  it.each(['dark', 'light'] as const)('retains direct and transitive consumers in %s mode', (mode) => {
    const definitions = {
      surface: { hex: '#ffffff', bg: '#111111' },
      consumer: { ref: 'surface.bg' },
      downstream: { ref: 'consumer' },
      foregroundOnly: { hex: '#ffffff' },
      missingBackground: { ref: 'foregroundOnly.bg' },
    } as const;
    const graph = createTokenGraph(definitions);
    try {
      expect(graph.get('consumer', mode).hex).toBe('#111111');
      expect(graph.dependencies('consumer', mode)).toEqual(['surface.bg']);
    } finally {
      graph.dispose();
    }

    const direct = collectTokenDependents(definitions, mode);
    expect(direct.get('surface.bg')).toEqual(['consumer']);
    expect(direct.get('foregroundOnly.bg')).toBeUndefined();
    expect(collectTransitiveTokenDependents(definitions, mode).get('surface.bg')).toEqual([
      'consumer', 'downstream',
    ]);
  });
});

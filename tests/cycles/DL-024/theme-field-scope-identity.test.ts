import { describe, expect, it } from 'vitest';
import { createTokenGraph } from '../../../packages/bijou/src/core/theme/graph.js';
import {
  collectTokenDependents,
  collectTransitiveTokenDependents,
} from '../../../packages/bijou/src/core/theme/graph-dependents.js';
import { nthColor, scope } from '../../../packages/bijou/src/core/theme/theme-rules.js';

describe.each(['dark', 'light'] as const)('field identity in %s mode', (mode) => {
  it('expands candidate scopes using authored paths', () => {
    const definitions = {
      source: '#123456',
      palette: { fg: '#000000', bg: { ref: 'source' } },
      'palette.extra': '#ffffff',
      consumer: nthColor(scope('palette'), 0),
    } as const;
    const graph = createTokenGraph(definitions);
    try {
      expect(graph.dependencies('consumer', mode)).toEqual(['palette.extra']);
      expect(graph.get('consumer', mode).hex).toBe('#ffffff');
      expect(collectTransitiveTokenDependents(definitions, mode).get('source'))
        .toEqual(['palette']);
    } finally {
      graph.dispose();
    }
  });

  it('retains a parent background independently of an explicit dotted token', () => {
    const definitions = {
      source: '#123456',
      palette: { fg: '#000000', bg: { ref: 'source' } },
      'palette.bg': '#ffffff',
      consumer: { ref: 'palette.bg' },
    } as const;
    const graph = createTokenGraph(definitions);
    try {
      expect(graph.get('palette', mode).bg).toBe('#123456');
      expect(graph.get('consumer', mode).hex).toBe('#ffffff');
      graph.set('source', '#abcdef');
      expect(graph.get('palette', mode).bg).toBe('#abcdef');
      expect(graph.get('palette.bg', mode).hex).toBe('#ffffff');
      expect(graph.get('consumer', mode).hex).toBe('#ffffff');
      expect(collectTokenDependents(definitions, mode).get('source')).toEqual(['palette']);
      expect(collectTransitiveTokenDependents(definitions, mode).get('source'))
        .toEqual(['palette']);
    } finally {
      graph.dispose();
    }
  });
});

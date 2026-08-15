import { describe, expect, it } from 'vitest';
import {
  BIJOU_DARK,
  collectTokenDependents,
  collectTransitiveTokenDependents,
  ruleAuthoredDefinitions,
  tokenDefinitionPaths,
} from '@flyingrobots/bijou';

function darkDefinitions() {
  const definitions = ruleAuthoredDefinitions(BIJOU_DARK);
  if (definitions === undefined) throw new Error('BIJOU_DARK lost its definitions.');
  return definitions;
}

describe('token definition paths', () => {
  it('flattens nested groups to dotted paths', () => {
    const paths = tokenDefinitionPaths(darkDefinitions());
    expect(paths).toContain('brand.accent');
    expect(paths).toContain('semantic.accent');
    expect(paths).toContain('surface.primary');
    expect(paths).not.toContain('brand');
  });
});

describe('token dependents', () => {
  it('reports the real consumers of semantic.accent', () => {
    const dependents = collectTokenDependents(darkDefinitions(), 'dark');
    expect([...(dependents.get('semantic.accent') ?? [])].sort()).toEqual([
      'border.secondary',
      'status.active',
      'ui.cursor',
      'ui.focusGutter',
      'ui.logo',
      'ui.sectionHeader',
    ]);
  });

  it('reports no consumers for a leaf token nothing references', () => {
    // The retired hand-maintained edge table claimed ui.cursor fed a
    // 'focus.current' token. No such token exists in the theme, and nothing
    // consumes ui.cursor at all. Edges read back out of the graph cannot
    // invent a destination the way a declared table can.
    const dependents = collectTokenDependents(darkDefinitions(), 'dark');
    expect(dependents.get('ui.cursor')).toBeUndefined();
  });

  it('never names a token that does not exist', () => {
    const definitions = darkDefinitions();
    const known = new Set(tokenDefinitionPaths(definitions));
    const dependents = collectTokenDependents(definitions, 'dark');

    for (const [dependency, consumers] of dependents) {
      const resolvable = known.has(dependency)
        || (dependency.endsWith('.bg') && known.has(dependency.slice(0, -3)));
      expect(resolvable, `dependency "${dependency}" is not a real token`).toBe(true);
      for (const consumer of consumers) {
        expect(known.has(consumer), `consumer "${consumer}" is not a real token`).toBe(true);
      }
    }
  });

  it('omits unresolved references but preserves virtual background paths', () => {
    const definitions = {
      surface: { primary: { fg: '#ffffff', bg: '#000000' } },
      consumer: { ref: 'surface.primary.bg' },
      broken: { ref: 'missing' },
    } as const;
    const dependents = collectTokenDependents(definitions);

    expect(dependents.get('surface.primary.bg')).toEqual(['consumer']);
    expect(dependents.get('missing')).toBeUndefined();
  });

  it('traces the collision DL-023 recorded, as a real edge', () => {
    const dependents = collectTokenDependents(darkDefinitions(), 'dark');
    // brand.accent feeds both the accent decision and the warning role, which
    // is why every gold chrome token renders in the exact colour a warning
    // does. The graph states it rather than leaving it to be noticed.
    const consumers = dependents.get('brand.accent') ?? [];
    expect(consumers).toContain('status.warning');
    expect(BIJOU_DARK.semantic.accent.hex).toBe(BIJOU_DARK.status.warning.hex);
  });

  it('reads only the adaptive branch selected for the requested mode', () => {
    const definitions = {
      inkLight: '#101010',
      inkDark: '#f0f0f0',
      adaptive: {
        light: { ref: 'inkLight' },
        dark: { ref: 'inkDark' },
      },
    } as const;

    expect(collectTokenDependents(definitions, 'light').get('inkLight')).toEqual(['adaptive']);
    expect(collectTokenDependents(definitions, 'light').get('inkDark')).toBeUndefined();
    expect(collectTokenDependents(definitions, 'dark').get('inkDark')).toEqual(['adaptive']);
    expect(collectTokenDependents(definitions, 'dark').get('inkLight')).toBeUndefined();
  });

  it('collects cyclic reference edges without resolving the cycle', () => {
    const definitions = {
      alpha: { ref: 'beta' },
      beta: { ref: 'alpha' },
    } as const;

    expect(collectTokenDependents(definitions).get('alpha')).toEqual(['beta']);
    expect(collectTokenDependents(definitions).get('beta')).toEqual(['alpha']);
    expect(collectTransitiveTokenDependents(definitions).get('alpha')).toEqual(['beta']);
  });

  it('follows virtual background edges through transitive closure', () => {
    const definitions = {
      base: '#111111',
      surface: { primary: { fg: '#ffffff', bg: { ref: 'base' } } },
      accent: { ref: 'surface.primary.bg' },
    } as const;

    expect(collectTransitiveTokenDependents(definitions).get('base')).toEqual([
      'surface.primary',
      'accent',
    ]);
  });
});

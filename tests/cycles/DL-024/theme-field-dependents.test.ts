import { describe, expect, it } from 'vitest';
import { collectTransitiveTokenDependents } from '@flyingrobots/bijou';

describe('field-specific transitive provenance', () => {
  it.each(['dark', 'light'] as const)('keeps foreground inputs out of an independent background in %s mode', (mode) => {
    const definitions = {
      source: '#123456',
      token: { fg: { ref: 'source' }, bg: '#ffffff' },
      consumer: { ref: 'token.bg' },
      foreground: { ref: 'token' },
    } as const;
    const affected = collectTransitiveTokenDependents(definitions, mode).get('source');
    expect(affected).toContain('token');
    expect(affected).toContain('foreground');
    expect(affected).not.toContain('consumer');
  });

  it.each(['dark', 'light'] as const)('follows a background input without crossing into the foreground in %s mode', (mode) => {
    const definitions = {
      source: '#123456',
      token: { fg: '#000000', bg: { ref: 'source' } },
      consumer: { ref: 'token.bg' },
      foreground: { ref: 'token' },
      downstream: { ref: 'consumer' },
    } as const;
    const affected = collectTransitiveTokenDependents(definitions, mode).get('source');
    expect(affected).toContain('token');
    expect(affected).toContain('consumer');
    expect(affected).toContain('downstream');
    expect(affected).not.toContain('foreground');
  });

  it('preserves an actual token named bg as a token path', () => {
    const definitions = {
      source: '#123456',
      group: { bg: { ref: 'source' } },
      consumer: { ref: 'group.bg' },
    } as const;
    expect(collectTransitiveTokenDependents(definitions).get('source')).toEqual(['group.bg', 'consumer']);
  });
});

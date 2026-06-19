import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setDefaultContext, _resetDefaultContextForTesting } from '../../context.js';
import { createTestContext } from '../../adapters/test/index.js';
import type { TokenValue } from './tokens.js';

type LegacyStyled = (token: TokenValue, text: string) => string;
type LegacyStyledStatus = (status: string, text?: string) => string;

async function legacyStyled(): Promise<LegacyStyled> {
  const module = await import('./styled.js');
  const value: unknown = Reflect.get(module, 'styled');
  if (isLegacyStyled(value)) return value;
  throw new TypeError('styled export is not callable');
}

async function legacyStyledStatus(): Promise<LegacyStyledStatus> {
  const module = await import('./styled.js');
  const value: unknown = Reflect.get(module, 'styledStatus');
  if (isLegacyStyledStatus(value)) return value;
  throw new TypeError('styledStatus export is not callable');
}

function isLegacyStyled(value: unknown): value is LegacyStyled {
  return typeof value === 'function';
}

function isLegacyStyledStatus(value: unknown): value is LegacyStyledStatus {
  return typeof value === 'function';
}

describe('styled', () => {
  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('throws if no default context set', async () => {
    _resetDefaultContextForTesting();
    const styled = await legacyStyled();
    expect(() => styled({ hex: '#ff0000' }, 'hi')).toThrow('[bijou] No default context configured');
  });

  it('delegates to default context style port', async () => {
    const ctx = createTestContext();
    setDefaultContext(ctx);
    const styled = await legacyStyled();
    const result = styled({ hex: '#ff0000' }, 'hello');
    // plainStyle returns text unchanged
    expect(result).toBe('hello');
  });
});

describe('styledStatus', () => {
  beforeEach(() => {
    const ctx = createTestContext();
    setDefaultContext(ctx);
  });

  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('resolves theme.status.success', async () => {
    const styledStatus = await legacyStyledStatus();
    const result = styledStatus('success');
    expect(result).toBe('success');
  });

  it('uses the status key as label when text omitted', async () => {
    const styledStatus = await legacyStyledStatus();
    const result = styledStatus('info');
    expect(result).toBe('info');
  });

  it('uses custom text when provided', async () => {
    const styledStatus = await legacyStyledStatus();
    const result = styledStatus('success', 'custom label');
    expect(result).toBe('custom label');
  });

  it('falls back to muted for unknown status', async () => {
    const styledStatus = await legacyStyledStatus();
    const result = styledStatus('UNKNOWN');
    // Falls back to muted token, uses 'UNKNOWN' as label
    expect(result).toBe('UNKNOWN');
  });

  it('throws if no default context set', async () => {
    _resetDefaultContextForTesting();
    const styledStatus = await legacyStyledStatus();
    expect(() => styledStatus('success')).toThrow('[bijou] No default context configured');
  });
});

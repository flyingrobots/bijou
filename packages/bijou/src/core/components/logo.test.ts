import { describe, it, expect } from 'vitest';
import { selectLogoSize, loadRandomLogo } from './logo.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('selectLogoSize', () => {
  it('returns small for narrow terminals', () => {
    expect(selectLogoSize(50, 25)).toBe('small');
  });

  it('returns small for short terminals', () => {
    expect(selectLogoSize(120, 15)).toBe('small');
  });

  it('returns medium for mid-size terminals', () => {
    expect(selectLogoSize(80, 25)).toBe('medium');
  });

  it('returns large for wide terminals', () => {
    expect(selectLogoSize(120, 40)).toBe('large');
  });
});

describe('loadRandomLogo', () => {
  it('returns fallback when directory has no files', () => {
    const ctx = createTestContext({
      io: { dirs: {}, files: {} },
    });
    const result = loadRandomLogo('/nonexistent', 'test', 'large', undefined, { ctx });
    expect(result.text).toBe('BIJOU');
    expect(result.lines).toBe(1);
    expect(result.width).toBe(5);
  });

  it('uses custom fallback text', () => {
    const ctx = createTestContext({
      io: { dirs: {}, files: {} },
    });
    const result = loadRandomLogo('/nonexistent', 'test', 'large', undefined, {
      fallbackText: 'MY APP',
      ctx,
    });
    expect(result.text).toBe('MY APP');
    expect(result.width).toBe(6);
  });

  it('loads a logo file from mock filesystem', () => {
    const logoContent = '  __  __\n |  \\/  |\n |_|\\/|_|';
    const ctx = createTestContext({
      io: {
        dirs: { '/logos/test/large': ['banner.txt'] },
        files: { '/logos/test/large/banner.txt': logoContent },
      },
    });
    const result = loadRandomLogo('/logos', 'test', 'large', undefined, { ctx });
    expect(result.text).toBe(logoContent);
    expect(result.lines).toBe(3);
    expect(result.width).toBe(9);
  });

  it('cascades to smaller size when requested size directory is empty', () => {
    const smallLogo = 'TINY';
    const ctx = createTestContext({
      io: {
        dirs: {
          '/logos/test/large': [],
          '/logos/test/medium': [],
          '/logos/test/small': ['tiny.txt'],
        },
        files: { '/logos/test/small/tiny.txt': smallLogo },
      },
    });
    const result = loadRandomLogo('/logos', 'test', 'large', undefined, { ctx });
    expect(result.text).toBe('TINY');
    expect(result.lines).toBe(1);
    expect(result.width).toBe(4);
  });
});

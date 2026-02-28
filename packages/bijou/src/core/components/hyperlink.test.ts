import { describe, it, expect } from 'vitest';
import { hyperlink } from './hyperlink.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('hyperlink', () => {
  it('outputs OSC 8 sequence in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = hyperlink('bijou', 'https://example.com', { ctx });
    expect(result).toBe('\x1b]8;;https://example.com\x1b\\bijou\x1b]8;;\x1b\\');
  });

  it('outputs OSC 8 sequence in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = hyperlink('docs', 'https://docs.example.com', { ctx });
    expect(result).toBe('\x1b]8;;https://docs.example.com\x1b\\docs\x1b]8;;\x1b\\');
  });

  it('uses fallback "both" (default) in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = hyperlink('bijou', 'https://example.com', { ctx });
    expect(result).toBe('bijou (https://example.com)');
  });

  it('uses fallback "url" in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = hyperlink('bijou', 'https://example.com', { fallback: 'url', ctx });
    expect(result).toBe('https://example.com');
  });

  it('uses fallback "text" in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = hyperlink('bijou', 'https://example.com', { fallback: 'text', ctx });
    expect(result).toBe('bijou');
  });

  it('always shows text (url) in accessible mode regardless of fallback', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = hyperlink('bijou', 'https://example.com', { fallback: 'url', ctx });
    expect(result).toBe('bijou (https://example.com)');
  });

  it('uses fallback format when no context is available', () => {
    const result = hyperlink('bijou', 'https://example.com');
    expect(result).toBe('bijou (https://example.com)');
  });

  it('handles empty text', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = hyperlink('', 'https://example.com', { ctx });
    expect(result).toBe(' (https://example.com)');
  });

  it('handles empty url', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = hyperlink('click here', '', { ctx });
    expect(result).toBe('click here ()');
  });

  it('handles URL with special characters', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const url = 'https://example.com/path?q=hello%20world&lang=en#section';
    const result = hyperlink('link', url, { ctx });
    expect(result).toBe(`\x1b]8;;${url}\x1b\\link\x1b]8;;\x1b\\`);
  });
});

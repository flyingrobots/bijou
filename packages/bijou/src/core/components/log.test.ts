import { describe, it, expect } from 'vitest';
import { log } from './log.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('log', () => {
  it('debug level uses DBG label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('debug', 'test message', { ctx })).toBe('[DBG] test message');
  });

  it('info level uses INF label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('info', 'test message', { ctx })).toBe('[INF] test message');
  });

  it('warn level uses WRN label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('warn', 'test message', { ctx })).toBe('[WRN] test message');
  });

  it('error level uses ERR label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('error', 'test message', { ctx })).toBe('[ERR] test message');
  });

  it('fatal level uses FTL label', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('fatal', 'test message', { ctx })).toBe('[FTL] test message');
  });

  it('debug level uses muted badge variant in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('debug', 'connecting', { ctx });
    expect(result).toContain(' DBG ');
    expect(result).toContain('connecting');
  });

  it('info level uses info badge variant in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('info', 'started', { ctx });
    expect(result).toContain(' INF ');
    expect(result).toContain('started');
  });

  it('warn level uses warning badge variant in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('warn', 'deprecated', { ctx });
    expect(result).toContain(' WRN ');
    expect(result).toContain('deprecated');
  });

  it('error level uses error badge variant in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('error', 'failed', { ctx });
    expect(result).toContain(' ERR ');
    expect(result).toContain('failed');
  });

  it('fatal level uses error badge variant in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('fatal', 'crash', { ctx });
    expect(result).toContain(' FTL ');
    expect(result).toContain('crash');
  });

  it('prefix: false omits the badge', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('info', 'just a message', { prefix: false, ctx })).toBe('just a message');
  });

  it('timestamp: true adds HH:MM:SS timestamp in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = log('info', 'request', { timestamp: true, ctx });
    expect(result).toMatch(/^\[\d{2}:\d{2}:\d{2}\] \[INF\] request$/);
  });

  it('timestamp: true adds timestamp in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = log('info', 'request', { timestamp: true, ctx });
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(result).toContain('request');
  });

  it('accessible mode uses LEVEL: message format', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    expect(log('debug', 'trace', { ctx })).toBe('DEBUG: trace');
    expect(log('info', 'note', { ctx })).toBe('INFO: note');
    expect(log('warn', 'caution', { ctx })).toBe('WARN: caution');
    expect(log('error', 'fail', { ctx })).toBe('ERROR: fail');
    expect(log('fatal', 'crash', { ctx })).toBe('FATAL: crash');
  });

  it('no context uses plain [LEVEL] message format', () => {
    const result = log('info', 'hello');
    expect(result).toBe('[INF] hello');
  });

  it('message only with no prefix and no timestamp', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    expect(log('info', 'bare message', { prefix: false, timestamp: false, ctx })).toBe('bare message');
  });
});

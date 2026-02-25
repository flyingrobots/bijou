import { describe, it, expect } from 'vitest';
import { timeline } from './timeline.js';
import { createTestContext } from '../../adapters/test/index.js';

const events: Parameters<typeof timeline>[0] = [
  { label: 'Started', status: 'active' },
  { label: 'Build', description: 'Compiling sources', status: 'success' },
  { label: 'Deploy', status: 'pending' },
];

describe('timeline', () => {
  it('renders dots and connectors in interactive mode', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = timeline(events, { ctx });
    expect(result).toContain('● Started');
    expect(result).toContain('● Build Compiling sources');
    expect(result).toContain('○ Deploy');
    expect(result).toContain('│');
  });

  it('renders dots and connectors in static mode', () => {
    const ctx = createTestContext({ mode: 'static' });
    const result = timeline(events, { ctx });
    expect(result).toContain('● Started');
    expect(result).toContain('○ Deploy');
  });

  it('renders bracketed status in pipe mode', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = timeline(events, { ctx });
    expect(result).toContain('[ACTIVE] Started');
    expect(result).toContain('[SUCCESS] Build - Compiling sources');
    expect(result).toContain('[PENDING] Deploy');
  });

  it('renders descriptive labels in accessible mode', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const result = timeline(events, { ctx });
    expect(result).toContain('Active: Started');
    expect(result).toContain('Success: Build. Compiling sources');
    expect(result).toContain('Pending: Deploy');
  });

  it('defaults to muted status', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = timeline([{ label: 'Unknown' }], { ctx });
    expect(result).toBe('[MUTED] Unknown');
  });

  it('uses hollow dot for muted and pending statuses', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = timeline([
      { label: 'A', status: 'muted' },
      { label: 'B', status: 'pending' },
    ], { ctx });
    expect(result).toContain('○ A');
    expect(result).toContain('○ B');
  });

  it('handles single event without connector', () => {
    const ctx = createTestContext({ mode: 'interactive' });
    const result = timeline([{ label: 'Only', status: 'success' }], { ctx });
    expect(result).toBe('● Only');
    expect(result).not.toContain('│');
  });
});

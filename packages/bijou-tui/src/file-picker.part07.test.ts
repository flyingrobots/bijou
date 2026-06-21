import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState } from './file-picker.js';

// ── height clamping ───────────────────────────────────────────────

describe('height clamping', () => {
  it('clamps height to 1 when 0 is provided', () => {
    const io = mockIO({ dirs: { '/dir': ['a.txt'] } });
    const state = createFilePickerState({ cwd: '/dir', io, height: 0 });
    expect(state.height).toBe(1);
  });

  it('clamps negative height to 1', () => {
    const io = mockIO({ dirs: { '/dir': ['a.txt'] } });
    const state = createFilePickerState({ cwd: '/dir', io, height: -5 });
    expect(state.height).toBe(1);
  });

  it('falls back for non-finite height and floors fractional height', () => {
    const io = mockIO({ dirs: { '/dir': ['a.txt'] } });
    expect(createFilePickerState({ cwd: '/dir', io, height: Number.NaN }).height).toBe(10);
    expect(createFilePickerState({ cwd: '/dir', io, height: 4.7 }).height).toBe(4);
  });
});

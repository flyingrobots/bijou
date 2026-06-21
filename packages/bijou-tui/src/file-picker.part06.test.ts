import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpEnter, fpBack } from './file-picker.js';

// ── readDir failure resilience ────────────────────────────────────

describe('readDir failure resilience', () => {
  it('createFilePickerState returns empty entries on unreadable dir', () => {
    const io = mockIO(); // no dirs configured — readDir returns []
    const state = createFilePickerState({ cwd: '/nonexistent', io });
    expect(state.entries).toEqual([]);
    expect(state.cwd).toBe('/nonexistent');
  });

  it('fpEnter falls back to empty on unreadable child dir', () => {
    // Parent has a dir entry, but child dir is not in mockIO
    const io = mockIO({ dirs: { '/parent': ['child/'] } });
    const state = createFilePickerState({ cwd: '/parent', io });
    const entered = fpEnter(state, io);
    expect(entered.cwd).toBe('/parent/child');
    expect(entered.entries).toEqual([]);
  });

  it('fpBack falls back to empty on unreadable parent dir', () => {
    const io = mockIO({ dirs: { '/parent/child': ['file.txt'] } });
    const state = createFilePickerState({ cwd: '/parent/child', io });
    const backed = fpBack(state, io);
    expect(backed.cwd).toBe('/parent');
    expect(backed.entries).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpFocusNext, fpFocusPrev } from './file-picker.js';

// NOTE: mockIO dirs entries use trailing '/' to indicate directories
function createMockIO() {
  return mockIO({
    dirs: {
      '/project': ['src/', 'README.md', 'package.json'],
      '/project/src': ['index.ts', 'utils/'],
      '/': ['project/', 'tmp/'],
    },
  });
}

// ── focus navigation ──────────────────────────────────────────────

describe('focus navigation', () => {
  it('focusNext moves to next entry', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const next = fpFocusNext(state);
    expect(next.focusIndex).toBe(1);
  });

  it('focusNext wraps around', () => {
    const io = createMockIO();
    let state = createFilePickerState({ cwd: '/project', io });
    for (const entry of state.entries) {
      void entry;
      state = fpFocusNext(state);
    }
    expect(state.focusIndex).toBe(0);
  });

  it('focusPrev wraps around', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const prev = fpFocusPrev(state);
    expect(prev.focusIndex).toBe(state.entries.length - 1);
  });

  it('focusNext is no-op on empty entries', () => {
    const io = mockIO({ dirs: { '/empty': [] } });
    const state = createFilePickerState({ cwd: '/empty', io });
    expect(fpFocusNext(state).focusIndex).toBe(0);
  });

  it('focusPrev is no-op on empty entries', () => {
    const io = mockIO({ dirs: { '/empty': [] } });
    const state = createFilePickerState({ cwd: '/empty', io });
    expect(fpFocusPrev(state).focusIndex).toBe(0);
  });
});

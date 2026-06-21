import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState } from './file-picker.js';

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

// ── createFilePickerState ─────────────────────────────────────────

describe('createFilePickerState', () => {
  it('lists entries with dirs first', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    expect(state.entries[0]).toEqual({ name: 'src', isDirectory: true });
    expect(state.entries[1]).toEqual({ name: 'package.json', isDirectory: false });
    expect(state.entries[2]).toEqual({ name: 'README.md', isDirectory: false });
  });

  it('starts with focus at 0', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    expect(state.focusIndex).toBe(0);
    expect(state.scrollY).toBe(0);
  });

  it('default height is 10', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    expect(state.height).toBe(10);
  });
});

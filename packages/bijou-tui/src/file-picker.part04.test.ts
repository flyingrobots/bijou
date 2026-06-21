import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpEnter } from './file-picker.js';

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

// ── extension filter ──────────────────────────────────────────────

describe('extension filter', () => {
  it('hides non-matching files', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io, filter: '.md' });
    const fileEntries = state.entries.filter(e => !e.isDirectory);
    expect(fileEntries.every(e => e.name.endsWith('.md'))).toBe(true);
    expect(fileEntries.some(e => e.name === 'README.md')).toBe(true);
  });

  it('directories are always shown', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io, filter: '.md' });
    const dirEntries = state.entries.filter(e => e.isDirectory);
    expect(dirEntries.length).toBeGreaterThan(0);
  });

  it('filter is preserved across directory navigation', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io, filter: '.ts' });
    const entered = fpEnter(state, io);
    // /project/src has index.ts and utils/ — filter should keep .ts files
    const fileEntries = entered.entries.filter(e => !e.isDirectory);
    expect(fileEntries.every(e => e.name.endsWith('.ts'))).toBe(true);
  });
});

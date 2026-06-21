import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpFocusNext, fpEnter, fpBack } from './file-picker.js';

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

// ── directory navigation ──────────────────────────────────────────

describe('directory navigation', () => {
  it('enter on directory changes cwd and refreshes entries', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    // First entry should be 'src' directory
    const entered = fpEnter(state, io);
    expect(entered.cwd).toBe('/project/src');
    expect(entered.focusIndex).toBe(0);
    expect(entered.entries.length).toBeGreaterThan(0);
  });

  it('enter on file is a no-op', () => {
    const io = createMockIO();
    let state = createFilePickerState({ cwd: '/project', io });
    // Move to a file entry
    state = fpFocusNext(state); // package.json (file)
    const result = fpEnter(state, io);
    expect(result.cwd).toBe('/project');
  });

  it('enter on empty entries is a no-op', () => {
    const io = mockIO({ dirs: { '/empty': [] } });
    const state = createFilePickerState({ cwd: '/empty', io });
    const result = fpEnter(state, io);
    expect(result.cwd).toBe('/empty');
  });

  it('back goes to parent directory', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project/src', io });
    const backed = fpBack(state, io);
    expect(backed.cwd).toBe('/project');
  });

  it('back at root is a no-op', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/', io });
    const backed = fpBack(state, io);
    expect(backed.cwd).toBe('/');
  });
});

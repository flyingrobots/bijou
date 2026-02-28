import { describe, it, expect } from 'vitest';
import {
  createFilePickerState,
  fpFocusNext,
  fpFocusPrev,
  fpEnter,
  fpBack,
  filePicker,
  filePickerKeyMap,
} from './file-picker.js';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import type { KeyMsg } from './types.js';

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

function keyMsg(key: string, mods?: Partial<KeyMsg>): KeyMsg {
  return { type: 'key', key, ctrl: false, alt: false, shift: false, ...mods };
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
    for (let i = 0; i < state.entries.length; i++) state = fpFocusNext(state);
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

// ── empty directory ───────────────────────────────────────────────

describe('empty directory', () => {
  it('renders empty message', () => {
    const io = mockIO({ dirs: { '/empty': [] } });
    const state = createFilePickerState({ cwd: '/empty', io });
    expect(state.entries).toEqual([]);
    const output = filePicker(state);
    expect(output).toContain('(empty)');
  });
});

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
});

// ── render ────────────────────────────────────────────────────────

describe('render', () => {
  it('shows cwd as header', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state);
    expect(output).toContain('/project');
  });

  it('shows focus indicator on focused entry', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state);
    expect(output).toContain('\u25b8');
  });

  it('shows directory indicator', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state);
    expect(output).toContain('d src/');
  });

  it('shows file indicator', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state);
    expect(output).toContain('- package.json');
  });

  it('uses custom indicators', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state, {
      focusIndicator: '>>',
      dirIndicator: 'D',
      fileIndicator: 'F',
    });
    expect(output).toContain('>> D src/');
    expect(output).toContain('F package.json');
  });

  it('respects scroll window', () => {
    const io = mockIO({
      dirs: {
        '/many': ['a/', 'b/', 'c/', 'd.txt', 'e.txt', 'f.txt'],
      },
    });
    const state = createFilePickerState({ cwd: '/many', io, height: 3 });
    const output = filePicker(state);
    const lines = output.split('\n');
    // header + 3 visible entries = 4 lines
    expect(lines).toHaveLength(4);
  });
});

// ── scroll adjustment ─────────────────────────────────────────────

describe('scroll adjustment', () => {
  it('scrolls down when focus moves past viewport', () => {
    const io = mockIO({
      dirs: {
        '/many': ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt'],
      },
    });
    let state = createFilePickerState({ cwd: '/many', io, height: 2 });
    state = fpFocusNext(state); // index 1
    state = fpFocusNext(state); // index 2 — should trigger scroll
    expect(state.scrollY).toBe(1);
  });

  it('scrolls up when focus wraps to top', () => {
    const io = mockIO({
      dirs: {
        '/many': ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt'],
      },
    });
    let state = createFilePickerState({ cwd: '/many', io, height: 2 });
    // Move to end
    for (let i = 0; i < 5; i++) state = fpFocusNext(state);
    // Now at index 0 (wrapped), scrollY should reset
    expect(state.focusIndex).toBe(0);
    expect(state.scrollY).toBe(0);
  });
});

// ── keymap ────────────────────────────────────────────────────────

describe('filePickerKeyMap', () => {
  const actions = {
    focusNext: 'next' as const,
    focusPrev: 'prev' as const,
    enter: 'enter' as const,
    back: 'back' as const,
    quit: 'quit' as const,
  };

  const km = filePickerKeyMap(actions);

  it('handles j/k for navigation', () => {
    expect(km.handle(keyMsg('j'))).toBe('next');
    expect(km.handle(keyMsg('k'))).toBe('prev');
  });

  it('handles arrow keys', () => {
    expect(km.handle(keyMsg('down'))).toBe('next');
    expect(km.handle(keyMsg('up'))).toBe('prev');
  });

  it('handles enter for directory entry', () => {
    expect(km.handle(keyMsg('enter'))).toBe('enter');
  });

  it('handles backspace and left for parent directory', () => {
    expect(km.handle(keyMsg('backspace'))).toBe('back');
    expect(km.handle(keyMsg('left'))).toBe('back');
  });

  it('handles quit', () => {
    expect(km.handle(keyMsg('q'))).toBe('quit');
    expect(km.handle(keyMsg('c', { ctrl: true }))).toBe('quit');
  });

  it('returns undefined for unbound keys', () => {
    expect(km.handle(keyMsg('x'))).toBeUndefined();
  });
});

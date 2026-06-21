import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext, mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpFocusNext, filePicker, filePickerSurface } from './file-picker.js';

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

// ── render ────────────────────────────────────────────────────────

describe('render', () => {
  const ctx = createTestContext();

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

  it('shows an app-selected entry marker when selectedIndex is provided', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state, { selectedIndex: 1 });

    expect(output).toContain('\u25b8   d src/');
    expect(output).toContain('  * - package.json');
  });

  it('uses a custom selected entry marker', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io });
    const output = filePicker(state, {
      selectedIndex: 0,
      selectedIndicator: '@',
    });

    expect(output).toContain('\u25b8 @ d src/');
  });

  it('renders a surface with a fixed header and viewport body', () => {
    const io = createMockIO();
    const state = createFilePickerState({ cwd: '/project', io, height: 2 });
    const surface = filePickerSurface(state, { width: 24 });
    const rendered = surfaceToString(surface, ctx.style);
    const lines = rendered.split('\n');

    expect(surface.width).toBe(24);
    expect(surface.height).toBe(3);
    expect(lines[0]).toContain('/project');
    expect(lines[1]).toContain('src/');
    expect(lines[2]).toContain('package.json');
  });

  it('surface path follows the shared viewport scroll window', () => {
    const io = createMockIO();
    let state = createFilePickerState({ cwd: '/project', io, height: 1 });
    state = fpFocusNext(state);

    const rendered = surfaceToString(
      filePickerSurface(state, { width: 24 }),
      ctx.style,
    );

    expect(rendered).toContain('/project');
    expect(rendered).toContain('package.json');
    expect(rendered).not.toContain('src/');
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

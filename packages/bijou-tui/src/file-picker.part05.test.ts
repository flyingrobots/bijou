import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, filePicker } from './file-picker.js';

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

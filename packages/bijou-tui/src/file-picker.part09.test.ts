import { describe, it, expect } from 'vitest';
import { mockIO } from '@flyingrobots/bijou/adapters/test';
import { createFilePickerState, fpFocusNext } from './file-picker.js';

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

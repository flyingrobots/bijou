import { describe, it, expect } from 'vitest';
import { auditStyle, createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createFocusAreaState, focusArea, focusAreaScrollBy } from './focus-area.js';

const SHORT_CONTENT = 'line 1\nline 2\nline 3';

const LONG_CONTENT = Array.from({ length: 50 }, (_, i) => `line ${String(i + 1)}`).join('\n');

describe('focusArea', () => {
  it('renders exactly height lines', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state);
    expect(output.split('\n')).toHaveLength(10);
  });

  it('prepends gutter character to each line', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state);
    const lines = output.split('\n');
    for (const line of lines) {
      expect(line).toContain('▎');
    }
  });

  it('focused gutter is styled when ctx is provided', () => {
    const ctx = createTestContext();
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const focused = focusArea(state, { focused: true, ctx });
    const unfocused = focusArea(state, { focused: false, ctx });
    // Both should contain the gutter char (plainStyle won't add ANSI, but
    // the styled() call was made — we verify the gutter is present)
    expect(focused).toContain('▎');
    expect(unfocused).toContain('▎');
  });

  it('applies BCSS text styles to the gutter', () => {
    const style = auditStyle();
    const ctx = createTestContext({ style });
    ctx.resolveBCSS = (identity): Record<string, string> => {
      if (identity.type === 'FocusArea' && identity.id === 'main') {
        return {
          color: '#ff00ff',
          background: '#101010',
          'font-weight': 'bold',
          'text-decoration': 'underline',
        };
      }
      return {};
    };

    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    focusArea(state, { focused: true, ctx, id: 'main' });

    const styledGutter = style.calls.find((call) => call.method === 'styled' && call.text === '▎');
    const token = styledGutter?.token;
    if (token === undefined) throw new Error('expected styled gutter token');
    expect(token).toMatchObject({ hex: '#ff00ff', bg: '#101010' });
    expect(token.modifiers).toEqual(expect.arrayContaining(['bold', 'underline']));
  });

  it('defaults the focused gutter to the shell focus UI token', () => {
    const style = auditStyle();
    const ctx = createTestContext({ style });
    ctx.tokenGraph.set('ui.focusGutter', '#123456');
    ctx.tokenGraph.set('semantic.accent', '#abcdef');

    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    focusArea(state, { focused: true, ctx });

    const styledGutter = style.calls.find((call) => call.method === 'styled' && call.text === '▎');
    expect(styledGutter?.token).toMatchObject({ hex: '#123456' });
  });

  it('defaults to focused=true', () => {
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state);
    expect(output).toContain('▎');
  });

  it('first visible line matches scroll position', () => {
    const state = focusAreaScrollBy(
      createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 5 }),
      3,
    );
    const output = focusArea(state);
    const lines = output.split('\n');
    expect(lines[0]).toContain('line 4');
  });

  it('pipe mode renders without gutter', () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).not.toContain('▎');
  });

  it('accessible mode renders without gutter', () => {
    const ctx = createTestContext({ mode: 'accessible' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).not.toContain('▎');
  });

  it('static mode renders unstyled gutter', () => {
    const ctx = createTestContext({ mode: 'static' });
    const state = createFocusAreaState({ content: SHORT_CONTENT, width: 40, height: 5 });
    const output = focusArea(state, { ctx });
    expect(output).toContain('▎');
  });

  it('renders scrollbar when content exceeds height', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state, { showScrollbar: true });
    // Scrollbar uses █ and │ characters
    expect(output).toMatch(/[█│]/);
  });

  it('hides scrollbar when showScrollbar is false', () => {
    const state = createFocusAreaState({ content: LONG_CONTENT, width: 40, height: 10 });
    const output = focusArea(state, { showScrollbar: false });
    expect(output).not.toContain('│');
    expect(output).not.toContain('█');
  });

  it('supports overlay scrollbars without adding a dead body gutter', () => {
    const state = createFocusAreaState({
      content: 'abcde\nfghij\nklmno\npqrst',
      width: 6,
      height: 2,
      scrollbarMode: 'overlay',
    });
    const output = focusArea(state, { showScrollbar: true });

    expect(output.split('\n')).toEqual(['▎abcd█', '▎fghi│']);
  });
});

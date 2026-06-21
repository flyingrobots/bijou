import { describe, it, expect } from 'vitest';
import { viewport, stripAnsi } from './viewport.js';

// ---------------------------------------------------------------------------
// viewport with scrollX
// ---------------------------------------------------------------------------
describe('viewport with scrollX', () => {
  it('shifts content right', () => {
    const wideContent = 'abcdefghijklmnop';
    const result = viewport({
      width: 5,
      height: 1,
      content: wideContent,
      scrollX: 3,
      showScrollbar: false,
    });
    const visible = stripAnsi(result).trimEnd();
    expect(visible).toBe('defgh');
  });
  it('scrollX=0 matches default behavior', () => {
    const content = 'abcdefghij';
    const withoutX = viewport({
      width: 5,
      height: 1,
      content,
      scrollX: 0,
      showScrollbar: false,
    });
    const withDefault = viewport({
      width: 5,
      height: 1,
      content,
      showScrollbar: false,
    });
    expect(withoutX).toBe(withDefault);
  });
});

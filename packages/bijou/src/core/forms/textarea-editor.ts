import type { BijouContext } from '../../ports/context.js';
import type { TextareaOptions } from './textarea-options.js';
import { isKey, isPrintableKey, subscribeFormKeyInput } from './form-utils.js';
import { createTextareaView } from './textarea-view.js';

export type { TextareaOptions } from './textarea-options.js';

export async function interactiveTextarea(options: TextareaOptions, ctx: BijouContext): Promise<string> {
  const { height, maxLength, render, clearRender, cleanup, hideCursor } = createTextareaView(options, ctx, () => ({ lines, cursorRow, cursorCol, scrollY, totalLength }));

  const lines: string[] = [''];
  let cursorRow = 0;
  let cursorCol = 0;
  let scrollY = 0;
  let totalLength = 0;

  function lineAt(index: number): string {
    return lines[index] ?? '';
  }

  function ensureCursorVisible(): void {
    if (cursorRow < scrollY) scrollY = cursorRow;
    if (cursorRow >= scrollY + height) scrollY = cursorRow - height + 1;
  }

  hideCursor();
  render();

  return new Promise<string>((resolve) => {
    const handle = subscribeFormKeyInput(ctx, (key) => {
      if (isKey(key, 'd', { ctrl: true })) {
        // Ctrl+D — submit
        handle.dispose();
        const text = lines.join('\n');
        const value = text || (options.defaultValue ?? '');
        cleanup(value, false);
        resolve(value);
        return;
      }

      if (isKey(key, 'c', { ctrl: true }) || isKey(key, 'escape')) {
        // Ctrl+C or Escape — cancel
        // TODO: bare \x1b may false-trigger on slow connections where escape
        // sequences arrive as separate bytes. Timer-based disambiguation is a
        // shared debt with filter-interactive.ts — unify in a future PR.
        handle.dispose();
        const value = options.defaultValue ?? '';
        cleanup(value, true);
        resolve(value);
        return;
      }

      if (isKey(key, 'enter')) {
        // Enter — newline (counts as 1 character for maxLength)
        if (maxLength != null && totalLength >= maxLength) return;
        const currentLine = lineAt(cursorRow);
        const before = currentLine.slice(0, cursorCol);
        const after = currentLine.slice(cursorCol);
        lines[cursorRow] = before;
        lines.splice(cursorRow + 1, 0, after);
        totalLength++;  // newline character
        cursorRow++;
        cursorCol = 0;
        ensureCursorVisible();
        clearRender();
        render();
        return;
      }

      if (isKey(key, 'backspace')) {
        // Backspace
        if (cursorCol > 0) {
          const line = lineAt(cursorRow);
          lines[cursorRow] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
          cursorCol--;
          totalLength--;  // removed one character
        } else if (cursorRow > 0) {
          // Merge with previous line
          const prevLine = lineAt(cursorRow - 1);
          const currentLine = lineAt(cursorRow);
          cursorCol = prevLine.length;
          lines[cursorRow - 1] = prevLine + currentLine;
          lines.splice(cursorRow, 1);
          cursorRow--;
          totalLength--;  // removed newline character
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      // Arrow keys
      if (isKey(key, 'up')) { // Up
        if (cursorRow > 0) {
          cursorRow--;
          cursorCol = Math.min(cursorCol, lineAt(cursorRow).length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'down')) { // Down
        if (cursorRow < lines.length - 1) {
          cursorRow++;
          cursorCol = Math.min(cursorCol, lineAt(cursorRow).length);
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'right')) { // Right
        if (cursorCol < lineAt(cursorRow).length) {
          cursorCol++;
        } else if (cursorRow < lines.length - 1) {
          cursorRow++;
          cursorCol = 0;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      if (isKey(key, 'left')) { // Left
        if (cursorCol > 0) {
          cursorCol--;
        } else if (cursorRow > 0) {
          cursorRow--;
          cursorCol = lineAt(cursorRow).length;
          ensureCursorVisible();
        }
        clearRender();
        render();
        return;
      }
      // Printable character
      if (isPrintableKey(key)) {
        if (maxLength != null && totalLength >= maxLength) return;
        const line = lineAt(cursorRow);
        lines[cursorRow] = line.slice(0, cursorCol) + key.text + line.slice(cursorCol);
        cursorCol++;
        totalLength++;  // added one character
        clearRender();
        render();
      }
    });
  });
}

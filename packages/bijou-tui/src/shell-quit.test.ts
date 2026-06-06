import { describe, expect, it } from 'vitest';
import { stripAnsi } from '@flyingrobots/bijou';
import { renderShellQuitOverlay } from './shell-quit.js';

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe('shell quit confirmation', () => {
  it('renders the quit controls once', () => {
    const overlay = renderShellQuitOverlay(80, 24);
    const text = stripAnsi(overlay.content);

    expect(text).toContain('Quit this app?');
    expect(occurrences(text, 'Y quit • N stay')).toBe(1);
  });
});

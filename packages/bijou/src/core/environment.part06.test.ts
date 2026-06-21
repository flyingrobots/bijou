import { describe, it } from 'vitest';
import { createTestContext, expectNoAnsi } from '../adapters/test/index.js';
import { box, headerBox } from './components/box.js';
import { progressBar } from './components/progress.js';

describe('NO_COLOR × component matrix', () => {
  it('box() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = box('test', { ctx });
    expectNoAnsi(result);
  });

  it('headerBox() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = headerBox('Title', { detail: 'Info', ctx });
    expectNoAnsi(result);
  });

  it('progressBar() with NO_COLOR has no ANSI codes', () => {
    const ctx = createTestContext({ mode: 'interactive', noColor: true });
    const result = progressBar(75, { ctx });
    expectNoAnsi(result);
  });
});

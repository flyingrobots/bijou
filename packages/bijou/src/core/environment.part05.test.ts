import { describe, it, expect } from 'vitest';
import { createTestContext } from '../adapters/test/index.js';
import { box } from './components/box.js';
import { table } from './components/table.js';
import { progressBar } from './components/progress.js';
import { spinnerFrame } from './components/spinner.js';

describe('component × mode matrix', () => {
  const modes = ['interactive', 'pipe', 'accessible'] as const;

  for (const mode of modes) {
    describe(`mode: ${mode}`, () => {
      it('box() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = box('test', { ctx });
        expect(typeof result).toBe('string');
        expect(result).toContain('test');
      });

      it('table() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = table({
          columns: [{ header: 'Col' }],
          rows: [['val']],
          ctx,
        });
        expect(typeof result).toBe('string');
      });

      it('progressBar() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = progressBar(50, { ctx });
        expect(typeof result).toBe('string');
      });

      it('spinnerFrame() renders without error', () => {
        const ctx = createTestContext({ mode });
        const result = spinnerFrame(0, { ctx });
        expect(typeof result).toBe('string');
      });
    });
  }
});

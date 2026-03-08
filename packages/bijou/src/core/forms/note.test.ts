import { describe, it, expect } from 'vitest';
import { note } from './note.js';
import { createTestContext } from '../../adapters/test/index.js';

describe('note', () => {
  it('renders message in interactive mode with accent line', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    await note({ message: 'Hello world', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Hello world');
    expect(output).toContain('│');
    expect(output).toContain('ℹ');
  });

  it('renders title in interactive mode', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    await note({ message: 'Body text', title: 'Important', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Important');
    expect(output).toContain('Body text');
    expect(output).toContain('ℹ');
  });

  it('renders plain text in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe' });
    await note({ message: 'Info here', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Note: Info here');
  });

  it('renders plain text with title in pipe mode', async () => {
    const ctx = createTestContext({ mode: 'pipe' });
    await note({ message: 'Info here', title: 'Warning', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Note (Warning): Info here');
  });

  it('renders plain text in accessible mode', async () => {
    const ctx = createTestContext({ mode: 'accessible' });
    await note({ message: 'Info here', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Note: Info here');
  });

  it('resolves to undefined (compatible with wizard)', async () => {
    const ctx = createTestContext({ mode: 'pipe' });
    const result = await note({ message: 'Test', ctx });
    expect(result).toBeUndefined();
  });

  it('handles multiline messages', async () => {
    const ctx = createTestContext({ mode: 'interactive' });
    await note({ message: 'Line 1\nLine 2\nLine 3', ctx });
    const output = ctx.io.written.join('');
    expect(output).toContain('Line 1');
    expect(output).toContain('Line 2');
    expect(output).toContain('Line 3');
  });
});

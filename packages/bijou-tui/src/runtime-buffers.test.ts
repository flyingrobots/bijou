import { describe, expect, it } from 'vitest';
import { RuntimeFramebuffers } from './runtime-buffers.js';

describe('RuntimeFramebuffers', () => {
  it('reuses pooled output capacity across compatible resets', () => {
    const buffers = new RuntimeFramebuffers(20, 10);
    const output = buffers.output;

    buffers.reset(10, 5);

    expect(buffers.output === output).toBe(true);
  });

  it('grows pooled output capacity when the viewport exceeds it', () => {
    const buffers = new RuntimeFramebuffers(2, 2);
    const output = buffers.output;

    buffers.reset(200, 100);

    expect(buffers.output === output).toBe(false);
    expect(buffers.output.byteLength).toBeGreaterThan(output.byteLength);
  });
});

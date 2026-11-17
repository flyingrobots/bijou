import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { collectInput } from './process.mjs';

describe('sealed hook input', () => {
  it('preserves exact pre-push bytes across arbitrary chunk boundaries', async () => {
    const input = Buffer.from('refs/heads/topic abc refs/heads/topic def\nrefs/tags/v1 000 refs/tags/v1 123\n');
    for (const boundary of [1, 3, 17, input.length - 1]) {
      const output = await collectInput(Readable.from([input.subarray(0, boundary), input.subarray(boundary)]));
      expect(output, `chunk boundary ${String(boundary)}`).toEqual(input);
    }
  });
  it('accepts the one MiB limit and refuses the next byte', async () => {
    // Oracle: the host hook contract caps stdin at exactly 1 binary MiB.
    const limit = 1024 ** 2;
    for (const length of [0, 1, 1024, limit]) {
      const input = Buffer.alloc(length, 0x61);
      expect(await collectInput(Readable.from([input]))).toEqual(input);
    }
    const oversized = collectInput(Readable.from([Buffer.alloc(limit), Buffer.from([1])])).then(() => 'accepted');
    await expect(oversized).rejects.toThrow('Hook stdin exceeds 1 MiB');
  });
});

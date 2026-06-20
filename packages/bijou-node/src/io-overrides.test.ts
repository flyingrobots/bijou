import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { nodeIO, scopedNodeIO } from './io.js';
import { capturedWriter } from './io.test-support.js';

async function withProcessStdin<T>(stdin: NodeJS.ReadableStream, runTest: () => Promise<T>): Promise<T> {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
  Object.defineProperty(process, 'stdin', { configurable: true, value: stdin });
  try {
    return await runTest();
  } finally {
    if (descriptor !== undefined) {
      Object.defineProperty(process, 'stdin', descriptor);
    }
  }
}

describe('nodeIO() host overrides', () => {
  it('routes readline prompts through the configured stdout writer', async () => {
    const stdin = new PassThrough();
    const stdout = capturedWriter();
    const io = nodeIO({ stdout });

    await withProcessStdin(stdin, async () => {
      const answer = io.question('Name? ');
      stdin.write('Bijou\n');
      await expect(answer).resolves.toBe('Bijou');
    });

    expect(stdout.text()).toBe('Name? ');
  });
});

describe('scopedNodeIO() host overrides', () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir !== undefined) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('passes terminal writes through configured writers when no base adapter is supplied', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    const stdout = capturedWriter();
    const stderr = capturedWriter();
    const io = scopedNodeIO({ root: tempDir, stdout, stderr });

    io.write('out');
    io.writeError('err');

    expect(stdout.text()).toBe('out');
    expect(stderr.text()).toBe('err');
  });
});

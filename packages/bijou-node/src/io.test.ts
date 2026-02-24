import { describe, it, expect, afterEach } from 'vitest';
import { nodeIO } from './io.js';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('nodeIO()', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('write() calls process.stdout.write', () => {
    const io = nodeIO();
    // Just verify it doesn't throw — stdout.write in test runner is fine
    expect(() => io.write('')).not.toThrow();
  });

  it('readFile() reads a real file', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-test-'));
    const filePath = join(tempDir, 'test.txt');
    writeFileSync(filePath, 'hello bijou');

    const io = nodeIO();
    expect(io.readFile(filePath)).toBe('hello bijou');
  });

  it('readFile() throws for missing file', () => {
    const io = nodeIO();
    expect(() => io.readFile('/tmp/bijou-nonexistent-file-xyz')).toThrow();
  });

  it('readDir() lists real directory contents', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-test-'));
    writeFileSync(join(tempDir, 'a.txt'), '');
    writeFileSync(join(tempDir, 'b.txt'), '');

    const io = nodeIO();
    const entries = io.readDir(tempDir);
    expect(entries).toContain('a.txt');
    expect(entries).toContain('b.txt');
  });

  it('readDir() throws for missing directory', () => {
    const io = nodeIO();
    expect(() => io.readDir('/tmp/bijou-nonexistent-dir-xyz')).toThrow();
  });

  it('joinPath() joins segments', () => {
    const io = nodeIO();
    expect(io.joinPath('/foo', 'bar', 'baz.txt')).toBe('/foo/bar/baz.txt');
  });

  it('setInterval() returns a disposable handle', () => {
    const io = nodeIO();
    let count = 0;
    const handle = io.setInterval(() => { count++; }, 10_000);
    expect(handle.dispose).toBeTypeOf('function');
    handle.dispose();
  });
});

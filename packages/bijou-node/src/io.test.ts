import { describe, it, expect, afterEach } from 'vitest';
import { nodeIO } from './io.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('nodeIO()', () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('write() does not throw', () => {
    const io = nodeIO();
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
    const missingFile = join(tmpdir(), `bijou-missing-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
    expect(() => io.readFile(missingFile)).toThrow();
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
    const missingDir = join(tmpdir(), `bijou-missing-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    expect(() => io.readDir(missingDir)).toThrow();
  });

  it('joinPath() joins segments', () => {
    const io = nodeIO();
    expect(io.joinPath('/foo', 'bar', 'baz.txt')).toBe(join('/foo', 'bar', 'baz.txt'));
  });

  it('setInterval() returns a disposable handle', () => {
    const io = nodeIO();
    const handle = io.setInterval(() => {}, 10_000);
    expect(handle.dispose).toBeTypeOf('function');
    handle.dispose();
  });

  // question() and rawInput() require a TTY stdin and are not unit-testable.
});

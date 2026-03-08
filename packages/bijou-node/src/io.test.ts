import { describe, it, expect, afterEach, vi } from 'vitest';
import { nodeIO } from './io.js';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
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

  it('write() calls process.stdout.write', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const io = nodeIO();
    io.write('hello');
    expect(spy).toHaveBeenCalledWith('hello');
    spy.mockRestore();
  });

  it('writeError() calls process.stderr.write', () => {
    const spy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const io = nodeIO();
    io.writeError('err');
    expect(spy).toHaveBeenCalledWith('err');
    spy.mockRestore();
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

  it('readDir() appends trailing / to directories', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-test-'));
    mkdirSync(join(tempDir, 'subdir'));
    writeFileSync(join(tempDir, 'file.txt'), '');

    const io = nodeIO();
    const entries = io.readDir(tempDir);
    expect(entries).toContain('subdir/');
    expect(entries).not.toContain('subdir');
    expect(entries).toContain('file.txt');
    expect(entries).not.toContain('file.txt/');
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

  it('setInterval() fires periodically and stops on dispose', () => {
    vi.useFakeTimers();
    try {
      const spy = vi.fn();
      const io = nodeIO();
      const handle = io.setInterval(spy, 50);
      vi.advanceTimersByTime(150);
      expect(spy).toHaveBeenCalledTimes(3);
      handle.dispose();
      vi.advanceTimersByTime(100);
      expect(spy).toHaveBeenCalledTimes(3); // no more calls after dispose
    } finally {
      vi.useRealTimers();
    }
  });

  // question() and rawInput() require a TTY stdin and are not unit-testable.
});

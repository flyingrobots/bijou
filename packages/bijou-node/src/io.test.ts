import { describe, it, expect, afterEach, vi } from 'vitest';
import { mockClock } from '@flyingrobots/bijou/adapters/test';
import { nodeIO, scopedNodeIO, ScopedNodeIOError } from './io.js';
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
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-test-'));
    const io = nodeIO();
    const missingFile = join(tempDir, 'missing.txt');
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
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-test-'));
    const io = nodeIO();
    const missingDir = join(tempDir, 'missing-dir');
    expect(() => io.readDir(missingDir)).toThrow();
  });

  it('joinPath() joins segments', () => {
    const io = nodeIO();
    expect(io.joinPath('/foo', 'bar', 'baz.txt')).toBe(join('/foo', 'bar', 'baz.txt'));
  });

  it('setInterval() fires periodically and stops on dispose', () => {
    const clock = mockClock();
    const spy = vi.fn();
    const io = nodeIO({ clock });
    const handle = io.setInterval(spy, 50);

    clock.advanceBy(150);
    expect(spy).toHaveBeenCalledTimes(3);

    handle.dispose();
    clock.advanceBy(100);
    expect(spy).toHaveBeenCalledTimes(3); // no more calls after dispose
  });

  // question() and rawInput() require a TTY stdin and are not unit-testable.
});

describe('scopedNodeIO()', () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('reads files relative to the declared root', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    mkdirSync(join(tempDir, 'docs'));
    writeFileSync(join(tempDir, 'docs', 'readme.txt'), 'inside root');

    const io = scopedNodeIO({ root: tempDir });
    expect(io.readFile('docs/readme.txt')).toBe('inside root');
  });

  it('lists directories relative to the declared root', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    mkdirSync(join(tempDir, 'docs'));
    mkdirSync(join(tempDir, 'docs', 'guides'));
    writeFileSync(join(tempDir, 'docs', 'readme.txt'), 'inside root');

    const io = scopedNodeIO({ root: tempDir });
    const entries = io.readDir('docs');
    expect(entries).toContain('guides/');
    expect(entries).toContain('readme.txt');
  });

  it('returns rooted paths from joinPath()', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    const io = scopedNodeIO({ root: tempDir });
    expect(io.joinPath('docs', 'readme.txt')).toBe(join(tempDir, 'docs', 'readme.txt'));
  });

  it('resolves write destinations inside the root', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    const io = scopedNodeIO({ root: tempDir });
    expect(io.resolvePath('captures/frame.gif')).toBe(join(tempDir, 'captures', 'frame.gif'));
  });

  it('rejects relative traversal outside the root', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));

    const io = scopedNodeIO({ root: tempDir });
    expect(() => io.readFile('../bijou-scoped-outside.txt')).toThrow(ScopedNodeIOError);
    expect(() => io.joinPath('docs', '..', '..', 'escape.txt')).toThrow(ScopedNodeIOError);
    expect(() => io.resolvePath('../escape.txt')).toThrow('escapes root');
  });

  it('rejects absolute paths outside the root', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    const outside = join(tmpdir(), 'bijou-outside.txt');

    const io = scopedNodeIO({ root: tempDir });
    expect(() => io.readFile(outside)).toThrow(ScopedNodeIOError);
    expect(() => io.readDir(tmpdir())).toThrow(ScopedNodeIOError);
  });

  it('passes through terminal writes from the base adapter', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'bijou-scoped-'));
    const spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const io = scopedNodeIO({ root: tempDir });

    io.write('hello');
    expect(spy).toHaveBeenCalledWith('hello');
    spy.mockRestore();
  });
});

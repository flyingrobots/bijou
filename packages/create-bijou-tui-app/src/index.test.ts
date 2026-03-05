import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createTemplateFiles,
  DEFAULT_TARGET_DIR,
  parseArgs,
  resolveTarget,
  scaffoldProject,
  usage,
} from './index.js';

describe('create-bijou-tui-app', () => {
  it('parses args with defaults', () => {
    expect(parseArgs([])).toEqual({
      targetDirArg: undefined,
      install: true,
      force: false,
      help: false,
    });
  });

  it('parses explicit flags', () => {
    expect(parseArgs(['my-app', '--no-install', '--yes'])).toEqual({
      targetDirArg: 'my-app',
      install: false,
      force: true,
      help: false,
    });
  });

  it('resolves target dir and package name', () => {
    const resolved = resolveTarget(undefined, '/tmp/work');
    expect(resolved.targetDir).toBe(DEFAULT_TARGET_DIR);
    expect(resolved.absTargetDir).toBe(resolve('/tmp/work', DEFAULT_TARGET_DIR));
    expect(resolved.packageName).toBe('bijou-tui-app');
  });

  it('creates template files containing a runnable main entry', () => {
    const files = createTemplateFiles('my-app');
    expect(files['package.json']).toContain('"name": "my-app"');
    expect(files['src/main.ts']).toContain('createTuiAppSkeleton');
    expect(files['src/main.ts']).toContain("title: 'My Bijou App'");
  });

  it('scaffolds files to target directory when install is disabled', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const target = join(root, 'demo-app');
      const result = scaffoldProject({
        targetDir: target,
        install: false,
      });

      expect(result.installed).toBe(false);
      expect(result.targetDir).toBe(target);

      const files = readdirSync(target);
      expect(files).toContain('package.json');
      expect(files).toContain('tsconfig.json');
      expect(files).toContain('README.md');
      expect(files).toContain('src');

      const main = readFileSync(join(target, 'src/main.ts'), 'utf8');
      expect(main).toContain('await run(createTuiAppSkeleton');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses non-empty target without --yes/force', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const target = join(root, 'occupied');
      mkdirSync(target, { recursive: true });
      writeFileSync(join(target, 'README.md'), 'existing', 'utf8');

      expect(() => scaffoldProject({
        targetDir: target,
        install: false,
      })).toThrow(/Target directory is not empty/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses target paths that already exist as files', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetFile = join(root, 'already-a-file');
      writeFileSync(targetFile, 'occupied', 'utf8');

      expect(() => scaffoldProject({
        targetDir: targetFile,
        install: false,
      })).toThrow(/Target path is not a directory/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prints npm create usage', () => {
    const text = usage();
    expect(text).toContain('npm create bijou-tui-app@latest');
    expect(text).toContain('--no-install');
  });
});

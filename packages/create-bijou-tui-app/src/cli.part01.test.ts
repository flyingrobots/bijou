import {
  describe,
  expect,
  it,
  join,
  mkdtempSync,
  rmSync,
  runCliCaptured,
  runCliCapturedForPlatform,
  tmpdir,
  writeFileSync,
} from './cli.test-support.js';

describe('create-bijou-tui-app cli', () => {
  it('prints usage for argument parsing errors', () => {
    const result = runCliCaptured(['--definitely-not-a-real-flag']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Unknown option');
    expect(result.stderr).toContain('Usage: npm create bijou-tui-app@latest');
  });
});

describe('create-bijou-tui-app cli', () => {
  it('does not print usage for non-argument runtime failures', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetFile = join(root, 'not-a-dir');
      writeFileSync(targetFile, 'occupied', 'utf8');

      const result = runCliCaptured([targetFile, '--no-install']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Target path is not a directory');
      expect(result.stderr).toContain('Tip: run with --help to see CLI options.');
      expect(result.stderr).not.toContain('Usage: npm create bijou-tui-app@latest');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('create-bijou-tui-app cli', () => {
  it('quotes target paths in next-step cd instructions', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my app');
      const result = runCliCaptured([targetDir, '--no-install']);
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain(targetDir);
      expect(cdLine).toMatch(/^\s*cd\s+(['"]).*\1$/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('create-bijou-tui-app cli', () => {
  it('escapes single quotes in cd instruction paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, "my app's workspace");
      const result = runCliCapturedForPlatform('darwin', [targetDir, '--no-install']);
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toContain("'\"'\"'");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('create-bijou-tui-app cli', () => {
  it('uses Windows-safe cd quoting when process platform is win32', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my app');
      const result = runCliCapturedForPlatform('win32', [targetDir, '--no-install']);
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain(`cd "${targetDir}"`);
      expect(cdLine).not.toContain(`cd '${targetDir}'`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('create-bijou-tui-app cli', () => {
  it('escapes cmd.exe metacharacters in Windows cd instructions', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-test-'));
    try {
      const targetDir = join(root, 'my %APPDATA%^ app');
      const result = runCliCapturedForPlatform('win32', [targetDir, '--no-install']);
      expect(result.code).toBe(0);
      const cdLine = result.stdout.split('\n').find((line) => line.trimStart().startsWith('cd '));
      expect(cdLine).toBeDefined();
      expect(cdLine).toContain('%%APPDATA%%^^');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

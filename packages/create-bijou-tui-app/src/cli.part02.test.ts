import {
  describe,
  existsSync,
  expect,
  it,
  join,
  mkdirSync,
  mkdtempSync,
  PACKAGE_ROOT,
  realpathSync,
  requireRecord,
  resolve,
  resolveInstalledCliCommand,
  resolveInstalledCliEntrypoint,
  rmSync,
  spawnSync,
  tmpdir,
} from './cli.test-support.js';

describe('create-bijou-tui-app cli', () => {
  it('installs a runnable packed CLI entrypoint and exports the npm bin', () => {
    const root = mkdtempSync(join(tmpdir(), 'create-bijou-pack-cli-'));
    const packDir = join(root, 'pack');
    const runnerDir = join(root, 'runner');
    const targetDir = join(root, 'generated-app');
    mkdirSync(packDir, { recursive: true });
    mkdirSync(runnerDir, { recursive: true });

    try {
      const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', packDir], {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 90_000,
      });
      expect(packed.error).toBeUndefined();
      expect(packed.status).toBe(0);
      const arrayStart = packed.stdout.indexOf('[');
      const arrayEnd = packed.stdout.lastIndexOf(']');
      expect(arrayStart).toBeGreaterThanOrEqual(0);
      expect(arrayEnd).toBeGreaterThan(arrayStart);
      const packOutput: unknown = JSON.parse(packed.stdout.slice(arrayStart, arrayEnd + 1));
      if (!Array.isArray(packOutput)) throw new Error('npm pack output was not an array');
      const filename = requireRecord(packOutput[0], 'npm pack output entry')['filename'];
      if (typeof filename !== 'string' || filename.length === 0) throw new Error('npm pack output did not include a filename');
      const tarball = resolve(packDir, filename);

      const installed = spawnSync(
        'npm',
        [
          'install',
          '--prefix', runnerDir,
          '--no-package-lock',
          '--no-save',
          '--no-audit',
          '--fund=false',
          `file:${tarball}`,
        ],
        {
          cwd: PACKAGE_ROOT,
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
          timeout: 90_000,
        },
      );
      expect(installed.error).toBeUndefined();
      expect(installed.status).toBe(0);

      const binPath = resolveInstalledCliCommand(runnerDir);
      expect(existsSync(binPath)).toBe(true);
      const entrypoint = resolveInstalledCliEntrypoint(runnerDir);
      expect(existsSync(entrypoint)).toBe(true);
      if (process.platform !== 'win32') {
        expect(realpathSync(binPath)).toBe(realpathSync(entrypoint));
      }
      const result = spawnSync(
        process.execPath,
        [entrypoint, targetDir, '--no-install'],
        {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Created project in');
      expect(existsSync(join(targetDir, 'package.json'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 240000);
});

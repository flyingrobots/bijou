import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { FIXTURE_ROOT, KEEP_TEMP, ROOT, SKIP_BUILD, SKIP_PTY_TESTS, runCommand } from './smoke-canaries.part01.js';
import { assertOutputFreeOfGarbage, packPublishableUnits, rewriteManifest, runSimpleNpmLifecycle } from './smoke-canaries.part02.js';
import { assertOutputContains, runTuiCanary } from './smoke-canaries.part04.js';

function runCoreStaticCanary(tempRoot: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const targetDir = resolve(tempRoot, 'core-static');
  cpSync(FIXTURE_ROOT, targetDir, { recursive: true });
  rewriteManifest(resolve(targetDir, 'package.json'), tarballSpecs);

  runSimpleNpmLifecycle(
    'install core/static canary',
    targetDir,
    ['install', '--no-fund', '--no-audit'],
    300000,
  );
  runSimpleNpmLifecycle('build core/static canary', targetDir, ['run', 'build']);

  process.stdout.write('run core/static canary ... ');
  const result = runCommand(
    'run core/static canary',
    process.execPath,
    ['dist/main.js'],
    {
      cwd: targetDir,
      env: {
        TERM: 'dumb',
        NO_COLOR: '1',
        CI: null,
      },
    },
    { quietSuccess: true, timeoutMs: 10000 },
  );
  const output = `${result.stdout}${result.stderr}`;
  assertOutputFreeOfGarbage('core/static canary', output);
  assertOutputContains(
    'core/static canary',
    output,
    [
      'Static Core Canary',
      'Compatibility seam',
      'Surface status:',
      'One-shot report rendered cleanly.',
      'CANARY_STATIC_OK',
    ],
  );
  process.stdout.write('ok\n');
}

function main(): void {
  try {
    if (SKIP_BUILD) {
      process.stdout.write('smoke-canaries: skipping workspace build (--skip-build)\n');
    } else {
      process.stdout.write('smoke-canaries: building workspace artifacts ... ');
      runCommand('workspace build', 'npm', ['run', 'build'], { cwd: ROOT }, { quietSuccess: true });
      process.stdout.write('ok\n');
    }

    const tempRoot = mkdtempSync(join(tmpdir(), 'bijou-canaries-'));

    try {
      const tarballSpecs = packPublishableUnits(tempRoot);
      if (SKIP_PTY_TESTS) {
        process.stdout.write('smoke-canaries: PTY smoke tests skipped (BIJOU_SKIP_PTY_TESTS=1). These tests verify ANSI output in a real terminal and should be run before release.\n');
      } else {
        runTuiCanary(tempRoot, tarballSpecs);
      }
      runCoreStaticCanary(tempRoot, tarballSpecs);
      process.stdout.write('smoke-canaries: all canaries passed\n');
    } finally {
      if (!KEEP_TEMP) {
        rmSync(tempRoot, { recursive: true, force: true });
      } else {
        process.stdout.write(`smoke-canaries: kept temp workspace at ${tempRoot}\n`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`smoke-canaries: FAIL\n${message}\n`);
    process.exitCode = 1;
  }
}

main();

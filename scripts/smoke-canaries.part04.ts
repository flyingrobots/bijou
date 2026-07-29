import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripAnsi } from './smoke-utils.js';
import { ROOT, TUI_CANARY_STEPS, runCommand, tail } from './smoke-canaries.part01.js';
import { assertOutputFreeOfGarbage, parseCheckpointSegments, rewriteManifest, runPtyScenario, runSimpleNpmLifecycle } from './smoke-canaries.part02.js';
import { assertCheckpointAbsent, assertCheckpointContains } from './smoke-canaries.part03.js';

function runTuiCanary(tempRoot: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const targetDir = resolve(tempRoot, 'generated-tui');
  const cliTarball = tarballSpecs['create-bijou-tui-app'];
  if (cliTarball == null) {
    throw new Error('missing packed create-bijou-tui-app tarball');
  }
  const cliRunnerDir = resolve(tempRoot, 'cli-runner');
  mkdirSync(cliRunnerDir, { recursive: true });
  runSimpleNpmLifecycle(
    'install packed scaffold CLI',
    ROOT,
    ['install', '--prefix', cliRunnerDir, '--no-package-lock', '--no-save', '--no-audit', '--fund=false', cliTarball],
  );
  const cliBin = resolve(cliRunnerDir, 'node_modules/.bin/create-bijou-tui-app');
  if (!existsSync(cliBin)) {
    throw new Error(`installed create-bijou-tui-app tarball did not produce a bin shim at ${cliBin}`);
  }
  process.stdout.write('generate TUI canary ... ');
  runCommand(
    'generate TUI canary',
    'npm',
    ['exec', '--prefix', cliRunnerDir, '--', 'create-bijou-tui-app', targetDir, '--no-install'],
    { cwd: ROOT },
    { quietSuccess: true },
  );
  process.stdout.write('ok\n');

  rewriteManifest(resolve(targetDir, 'package.json'), tarballSpecs);

  runSimpleNpmLifecycle(
    'install TUI canary',
    targetDir,
    ['install', '--no-fund', '--no-audit'],
    300000,
  );
  runSimpleNpmLifecycle('build TUI canary', targetDir, ['run', 'build']);

  process.stdout.write('run TUI canary ... ');
  const output = runPtyScenario(targetDir, TUI_CANARY_STEPS);
  assertOutputFreeOfGarbage('TUI canary', output);
  const checkpoints = parseCheckpointSegments(output);
  assertCheckpointContains(checkpoints, 'initial', [
    'My Bijou App',
    'Home',
    'Split',
    'Home ready',
    'Supplemental drawer',
    'Open: yes',
  ]);
  assertCheckpointContains(checkpoints, 'split', [
    'Split ready',
    '1/3',
    'Secondary context',
  ]);
  assertCheckpointContains(checkpoints, 'home-return', [
    'Home ready',
    'Supplemental drawer',
    'Open: yes',
  ]);
  assertCheckpointContains(checkpoints, 'drawer-closed', [
    'Open: no',
  ]);
  assertCheckpointContains(checkpoints, 'resize-large', [
    'Home ready',
    'Home',
  ]);
  assertCheckpointContains(checkpoints, 'resize-small', [
    'Home ready',
    'Home',
  ]);
  assertCheckpointContains(checkpoints, 'quit-open', [
    'Quit?',
    'Quit this app?',
  ]);
  assertCheckpointAbsent(checkpoints, 'quit-cancel', [
    'Quit?',
  ]);
  assertCheckpointContains(checkpoints, 'quit-reopen', [
    'Quit?',
    'Quit this app?',
  ]);
  process.stdout.write('ok\n');
}

function assertOutputContains(label: string, output: string, expected: readonly string[]): void {
  const clean = stripAnsi(output);
  const missing = expected.filter((needle) => !clean.includes(needle));
  if (missing.length > 0) {
    throw new Error(`${label} output missing expected text: ${missing.join(', ')}\n${tail(clean)}`);
  }
}

export { assertOutputContains, runTuiCanary };

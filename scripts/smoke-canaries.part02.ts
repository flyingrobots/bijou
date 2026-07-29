import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectGarbage, PTY_MARKER_PREFIX, rewritePackageManifestToTarballs, stripAnsi, type PtyStep } from './smoke-utils.js';
import { ROOT, discoverPublishableUnits, requireJsonRecord, runCommand, tail } from './smoke-canaries.part01.js';

function parseJsonArray(text: string, label: string): readonly unknown[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error(`${label} is not an array`);
  return parsed;
}

function parsePackResult(stdout: string, packageName: string): { filename: string } {
  const trimmed = stdout.trim();
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
    throw new Error(`could not parse npm pack output for ${packageName}\n${trimmed}`);
  }

  const parsed = parseJsonArray(trimmed.slice(arrayStart, arrayEnd + 1), `npm pack output for ${packageName}`);
  const filename = requireJsonRecord(parsed[0], `npm pack output for ${packageName}`)['filename'];
  if (typeof filename !== 'string' || filename === '') {
    throw new Error(`npm pack did not report a filename for ${packageName}\n${trimmed}`);
  }

  return { filename };
}

function packPublishableUnits(tempRoot: string): Readonly<Record<string, string>> {
  const tarballDir = resolve(tempRoot, 'tarballs');
  mkdirSync(tarballDir, { recursive: true });
  const tarballSpecs: Record<string, string> = {};

  for (const unit of discoverPublishableUnits()) {
    process.stdout.write(`pack ${unit.name} ... `);
    const result = runCommand(
      `pack ${unit.name}`,
      'npm',
      ['pack', '--json', '--pack-destination', tarballDir],
      { cwd: unit.dir },
      { quietSuccess: true },
    );
    const packed = parsePackResult(result.stdout, unit.name);
    tarballSpecs[unit.name] = `file:${resolve(tarballDir, packed.filename)}`;
    process.stdout.write('ok\n');
  }

  return tarballSpecs;
}

function runSimpleNpmLifecycle(
  label: string,
  cwd: string,
  args: readonly string[],
  timeoutMs = 120000,
): void {
  process.stdout.write(`${label} ... `);
  runCommand(label, 'npm', [...args], { cwd }, { quietSuccess: true, timeoutMs });
  process.stdout.write('ok\n');
}

function rewriteManifest(packageJsonPath: string, tarballSpecs: Readonly<Record<string, string>>): void {
  const source = readFileSync(packageJsonPath, 'utf8');
  const rewritten = rewritePackageManifestToTarballs(source, tarballSpecs);
  writeFileSync(packageJsonPath, rewritten, 'utf8');
}

function runPtyScenario(cwd: string, steps: readonly PtyStep[]): string {
  const spec = {
    argv: [process.execPath, 'dist/main.js'],
    cwd,
    cols: 100,
    rows: 30,
    env: {
      TERM: 'xterm-256color',
      CI: null,
      NO_COLOR: null,
      BIJOU_ACCESSIBLE: null,
    },
    steps,
  };

  const result = runCommand(
    'run TUI canary',
    'python3',
    [resolve(ROOT, 'scripts/pty-driver.py')],
    {
      cwd: ROOT,
      env: {
        BIJOU_PTY_SPEC: JSON.stringify(spec),
        PYTHONDONTWRITEBYTECODE: '1',
      },
      timeoutMs: 20000,
    },
    { quietSuccess: true },
  );

  return `${result.stdout}${result.stderr}`;
}

function assertOutputFreeOfGarbage(label: string, output: string): void {
  const clean = stripAnsi(output);
  const garbage = detectGarbage(clean);
  if (garbage != null) {
    throw new Error(`${label} produced garbage output: ${garbage}\n${tail(clean)}`);
  }
}

function parseCheckpointSegments(output: string): ReadonlyMap<string, string> {
  const clean = stripAnsi(output);
  const lines = clean.split('\n');
  const checkpoints = new Map<string, string>();
  const buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith(PTY_MARKER_PREFIX)) {
      const label = line.slice(PTY_MARKER_PREFIX.length).trim();
      checkpoints.set(label, buffer.join('\n'));
      buffer.length = 0;
      continue;
    }
    buffer.push(line);
  }

  return checkpoints;
}

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function collapseWhitespace(text: string): string {
  return compactWhitespace(text).replace(/\s+/g, '');
}

export { assertOutputFreeOfGarbage, collapseWhitespace, compactWhitespace, packPublishableUnits, parseCheckpointSegments, rewriteManifest, runPtyScenario, runSimpleNpmLifecycle };

import { mkdirSync, readdirSync, copyFileSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execute } from './process.mjs';
import { startWorker, stopWorker, measureWorker } from './worker.mjs';
import { LIMITS, WORKER } from './constants.mjs';
import { templateConsumerManifest } from './consumer-manifest.mjs';
import { copyLocalTarballs } from './local-tarballs.mjs';
export async function prepareDependencies(snapshot, image, worker = WORKER, signal) {
  const run = (argv, options = {}) => execute(argv, { ...options, signal });
  const name = `${worker}-dependencies`;
  const directory = join(snapshot.directory, 'dependency-input');
  mkdirSync(join(directory, 'source', 'packages'), { recursive: true });
  for (const path of ['package.json', 'package-lock.json']) copyFileSync(join(snapshot.source, path), join(directory, 'source', path));
  copyLocalTarballs(JSON.parse(readFileSync(join(snapshot.source, 'package-lock.json'), 'utf8')), snapshot.source, join(directory, 'source'));
  mkdirSync(join(directory, 'source', 'bench'));
  copyFileSync(join(snapshot.source, 'bench', 'package.json'), join(directory, 'source', 'bench', 'package.json'));
  mkdirSync(join(directory, 'source', 'canary'));
  copyFileSync(join(snapshot.source, 'scripts/canary-fixtures/core-static/package.json'), join(directory, 'source', 'canary', 'package.json'));
  mkdirSync(join(directory, 'source', 'tui-consumer'));
  const template = readFileSync(join(snapshot.source, 'packages/create-bijou-tui-app/src/index.part03.ts'), 'utf8');
  writeFileSync(join(directory, 'source', 'tui-consumer', 'package.json'), JSON.stringify(templateConsumerManifest(template)));
  for (const entry of readdirSync(join(snapshot.source, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const target = join(directory, 'source', 'packages', entry.name); mkdirSync(target);
    copyFileSync(join(snapshot.source, 'packages', entry.name, 'package.json'), join(target, 'package.json'));
  }
  mkdirSync(join(directory, 'control'));
  copyFileSync(new URL('./dependencies.mjs', import.meta.url), join(directory, 'control', 'dependencies.mjs'));
  const payload = (await run(['tar', '-cf', '-', '-C', directory, 'source', 'control'], { binary: true, maxBytes: LIMITS.source })).output;
  await startWorker(name, image, 'bridge');
  try {
    await run(['docker', 'exec', '-i', name, 'tar', 'xf', '-', '-C', '/work'], { input: payload });
    // This phase executes no package lifecycle, application source, test or build.
    await run(['docker', 'exec', name, 'node', '/work/control/dependencies.mjs'], {
      monitor: () => measureWorker(name), onData: (chunk) => process.stdout.write(chunk),
    });
    return (await run(['docker', 'exec', name, 'tar', 'cf', '-',
      '-C', '/work/source', 'node_modules', '-C', '/home/test', '.npm'], {
      binary: true, maxBytes: LIMITS.archive,
    })).output;
  } finally { await stopWorker(name); rmSync(directory, { recursive: true, force: true }); }
}

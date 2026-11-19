#!/usr/bin/env node
import { mkdirSync, writeFileSync, rmSync, existsSync, copyFileSync, readdirSync, lstatSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, isAbsolute, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execute, readInput, requireFree } from './process.mjs';
import { snapshot } from './snapshot.mjs';
import { validateWindowsWorker as validate } from './windows-policy.mjs';
import { templateConsumerManifest } from './consumer-manifest.mjs';
import { requireWindowsBootstrapClear } from './windows-quarantine.mjs';
import { validateWindowsUsage, windowsUsageGrowth } from './windows-usage.mjs';
import { parseWorkerStorage, storageContract, storageMeasureProgram } from './windows-storage.mjs';
import { assignSourceOwnerProgram, prepareWorkerProgram } from './windows-worker.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const command = process.argv.slice(2);
if (command.shift() !== '--' || !command.length) throw new Error('Usage: windows.mjs -- command args...');
if (process.platform !== 'win32' || process.env.GITHUB_ACTIONS !== 'true'
    || process.env.RUNNER_ENVIRONMENT !== 'github-hosted' || !isAbsolute(process.env.RUNNER_TEMP ?? '')
    || !existsSync(process.env.RUNNER_TEMP) || !/^\d+$/u.test(process.env.GITHUB_RUN_ID ?? '')) {
  throw new Error('Windows runner currently requires an isolated GitHub-hosted Windows job');
}
const image = 'bijou-sealed-windows-node22:local';
const name = `bijou-sealed-windows-${process.env.GITHUB_RUN_ID}-${randomUUID()}`;
const destination = join(process.env.RUNNER_TEMP, 'bijou-sealed-evidence', randomUUID());
const GiB = 1024 ** 3;
const label = 'org.bijou.sealed-tests';
const ps = ['powershell', '-NoLogo', '-NoProfile', '-NonInteractive', '-Command'];
const generatedBudget = 40 * 1024 ** 2;
const npm = ['node', 'C:\\node\\node_modules\\npm\\bin\\npm-cli.js'];
requireFree(root);
requireWindowsBootstrapClear();
mkdirSync(destination, { recursive: true });
let snap; let created = false; let sealed = false; let cleanupComplete = false;
let backing; let lastBackingFree; let backingGrowth = 0;
let generatedPeak = { volumeGrowth: 0, backingGrowth: 0, samples: 0 };
let dataBaseline; let dataBackingStart = 0; let logBaseline; let logBackingStart = 0;
const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => controller.abort());

async function docker(args, options = {}) {
  return execute(['docker', ...args], { ...options, signal: options.cleanup ? undefined : controller.signal,
    ...(!options.cleanup && backing ? { hostPath: backing } : {}) });
}
async function inspect() {
  return JSON.parse((await docker(['inspect', name], { cleanup: true })).output.toString())[0];
}
async function measure(baseline = false) {
  const backingFree = requireFree(backing);
  if (lastBackingFree !== undefined) backingGrowth += Math.max(0, lastBackingFree - backingFree);
  lastBackingFree = backingFree;
  const worker = await inspect(); validate(worker, sealed);
  const result = await docker(['exec', name, ...ps, storageMeasureProgram], { timeout: 15000 });
  const usage = { ...parseWorkerStorage(result.output.toString()), backingFree };
  if (usage.processes < 1 || usage.processes > 256) throw new Error('Windows process budget exceeded');
  const data = validateWindowsUsage(usage, dataBaseline ?? usage, backingGrowth - dataBackingStart, 4 * GiB, 'data');
  if (baseline) { logBaseline = usage; logBackingStart = backingGrowth; }
  // MEASUREMENT ONLY (#788): the generated-data budget is observed here, not enforced. Never merge.
  let generated = 0;
  if (logBaseline) {
    const seen = windowsUsageGrowth(usage, logBaseline, backingGrowth - logBackingStart);
    generatedPeak = { volumeGrowth: Math.max(generatedPeak.volumeGrowth, seen.volumeGrowth),
      backingGrowth: Math.max(generatedPeak.backingGrowth, seen.backingGrowth), samples: generatedPeak.samples + 1 };
    generated = Math.max(seen.volumeGrowth, seen.backingGrowth);
  }
  Object.assign(usage, { data, generated, backingGrowth });
  return usage;
}
function manifests(snapshot) {
  const target = join(snapshot.directory, 'manifests'); mkdirSync(target);
  for (const file of ['package.json', 'package-lock.json']) copyFileSync(join(snapshot.source, file), join(target, file));
  mkdirSync(join(target, 'bench'));
  copyFileSync(join(snapshot.source, 'bench', 'package.json'), join(target, 'bench', 'package.json'));
  mkdirSync(join(target, 'canary'));
  copyFileSync(join(snapshot.source, 'scripts/canary-fixtures/core-static/package.json'), join(target, 'canary', 'package.json'));
  mkdirSync(join(target, 'tui-consumer'));
  const template = readFileSync(join(snapshot.source, 'packages/create-bijou-tui-app/src/index.part03.ts'), 'utf8');
  writeFileSync(join(target, 'tui-consumer', 'package.json'), JSON.stringify(templateConsumerManifest(template)));
  for (const entry of readdirSync(join(snapshot.source, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(target, 'packages', entry.name); mkdirSync(directory, { recursive: true });
    copyFileSync(join(snapshot.source, 'packages', entry.name, 'package.json'), join(directory, 'package.json'));
  }
  return target;
}
function cacheSize(path, state = { entries: 0, bytes: 0 }) {
  if (!existsSync(path)) return 0;
  for (const entry of readdirSync(path)) {
    if (++state.entries > 100000) throw new Error('Dependency cache exceeds 100000 entries');
    const child = join(path, entry); const stat = lstatSync(child);
    if (stat.isSymbolicLink()) throw new Error('Dependency cache symlink refused');
    if (stat.isDirectory()) cacheSize(child, state);
    else state.bytes += stat.size;
    if (state.bytes > GiB) throw new Error('Dependency cache exceeds 1 GiB');
  }
  return state.bytes;
}
async function createWorker(network) {
  dataBaseline = undefined; logBaseline = undefined; dataBackingStart = backingGrowth;
  created = true;
  await docker(['create', '--name', name, '--label', `${label}=windows-v1`, '--isolation', 'process',
    '--network', network, '--cpu-count', '2', '--memory', '6g', '--storage-opt', `size=${storageContract.requestedSize}`,
    '--log-driver', 'json-file', '--log-opt', 'max-size=1m', '--log-opt', 'max-file=1', image]);
  validate(await inspect(), network === 'none');
  await docker(['start', name]);
  await docker(['exec', name, ...ps, prepareWorkerProgram]);
  // The first measurement also admits the worker volume as the storage boundary.
  dataBaseline = await measure();
  dataBackingStart = backingGrowth;
}
async function assignSourceOwner() {
  // Git checks ownership of the worktree root as well as .git. The latter is
  // created by ContainerUser; Docker copy leaves the former administrator-owned.
  await docker(['exec', name, ...ps, assignSourceOwnerProgram], { timeout: 15000 });
}
try {
  backing = JSON.parse((await docker(['info', '--format', '{{json .DockerRootDir}}'])).output.toString());
  lastBackingFree = requireFree(backing);
  const toolchain = JSON.parse((await docker(['image', 'inspect', image])).output.toString())[0];
  if (toolchain.Os !== 'windows' || toolchain.Size > 20 * GiB) throw new Error('Windows toolchain image invalid');
  const sourceIndex = process.env.GIT_INDEX_FILE ? resolve(process.cwd(), process.env.GIT_INDEX_FILE) : undefined;
  snap = await snapshot(root, command, await readInput(), { generatedBudget, signal: controller.signal,
    sourceIndex, fullPush: process.env.BIJOU_FULL_PUSH === '1' });
  await createWorker('nat');
  await docker(['cp', `${manifests(snap)}\\.`, `${name}:C:\\work\\source`]);
  await docker(['cp', fileURLToPath(new URL('./windows-dependencies.mjs', import.meta.url)), `${name}:C:\\work\\windows-dependencies.mjs`]);
  await assignSourceOwner();
  // Only dependency resolution gets network access. Lifecycle scripts stay disabled.
  await docker(['exec', '--user', 'ContainerUser', '--workdir', 'C:\\work\\source', name,
    'node', 'C:\\work\\windows-dependencies.mjs'], { monitor: measure });
  await docker(['stop', '--time', '2', name]);
  if ((await inspect()).State.Running) throw new Error('Dependency worker did not stop');
  const cache = join(snap.directory, 'npm-cache');
  await docker(['cp', `${name}:C:\\home\\npm-cache`, cache], { monitor: () => cacheSize(cache) });
  cacheSize(cache);
  await docker(['rm', name]); created = false;
  sealed = true;
  await createWorker('none');
  const config = await inspect(); validate(config, true);
  // Full source and Git objects enter a fresh worker that has never had a network.
  await docker(['cp', cache, `${name}:C:\\home`]);
  await docker(['cp', `${snap.source}\\.`, `${name}:C:\\work\\source`]);
  await assignSourceOwner();
  await docker(['exec', '--user', 'ContainerUser', '--workdir', 'C:\\work\\source', name,
    'node', 'scripts/docker-seal/windows-initialize.mjs']);
  await docker(['exec', '--user', 'ContainerUser', '--workdir', 'C:\\work\\source', name,
    ...npm, 'ci', '--offline', '--engine-strict', '--ignore-scripts', '--no-audit', '--no-fund'], { monitor: measure });
  await measure(true);
  writeFileSync(join(destination, 'admission.json'), JSON.stringify({
    sourceSha256: snap.digest, image: toolchain.Id, hostConfig: config.HostConfig,
    limits: { cpu: 2, memory: 6 * GiB, storage: storageContract.maximumCapacityBytes, data: 4 * GiB, temporary: 4 * GiB, generated: generatedBudget, processes: 256 },
    storage: storageContract,
    usage: await measure(), command,
  }, null, 2));
  await docker(['exec', '--user', 'ContainerUser', '--workdir', 'C:\\work\\source', name,
    ...npm, 'rebuild', '--offline'], { monitor: measure });
  const result = await docker(['exec', '--user', 'ContainerUser', '--workdir', 'C:\\work\\source', name,
    'node', 'scripts/docker-seal/windows-exec.mjs'], {
    allowFailure: true, monitor: measure, onData: (chunk) => process.stdout.write(chunk),
  });
  writeFileSync(join(destination, 'stdout.log'), result.output);
  writeFileSync(join(destination, 'receipt.json'), JSON.stringify({
    code: result.code, sourceSha256: snap.digest, storage: storageContract, usage: await measure(),
  }));
  process.exitCode = result.code;
} finally {
  process.stdout.write(`${JSON.stringify({ generatedBudgetObservation: { limit: generatedBudget, ...generatedPeak } })}\n`);
  if (created) {
    const state = await docker(['inspect', name], { allowFailure: true, cleanup: true });
    if (state.code === 0) {
      const owned = JSON.parse(state.output.toString())[0];
      if (owned.Config.Labels?.[label] !== 'windows-v1') throw new Error('Refusing cleanup of unowned Windows worker');
      await docker(['stop', '--time', '2', name], { timeout: 15000, cleanup: true });
      if ((await inspect()).State.Running) throw new Error('Windows worker still running; retained for recovery');
      await docker(['rm', name], { timeout: 15000, cleanup: true });
    } else if (!/No such (object|container)/iu.test(state.output.toString())) {
      throw new Error('Windows worker custody uncertain; retained for recovery');
    }
    cleanupComplete = true;
  } else cleanupComplete = true;
  if (snap && cleanupComplete) rmSync(snap.directory, { recursive: true, force: true });
  process.stdout.write(`Sealed Windows evidence: ${destination}\n`);
}

import { readFileSync, writeFileSync, mkdirSync, readdirSync, lstatSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { imageName, WORKER, LIMITS } from './constants.mjs';
import { execute as perform, readInput, requireFree } from './process.mjs';
import { snapshot } from './snapshot.mjs';
import { prepareDependencies } from './prepare.mjs';
import { assertWorkerFree, startWorker, stopWorker, measureWorker } from './worker.mjs';
import { exportArtifacts, validateExportPath } from './export.mjs';
const controller = new AbortController();
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => controller.abort());
const execute = (argv, options = {}) => perform(argv, { ...options, signal: controller.signal });
const root = fileURLToPath(new URL('../../', import.meta.url));
const argv = process.argv.slice(2); const split = argv.indexOf('--');
if (split < 0 || split === argv.length - 1) throw new Error('Missing command');
let version = '22'; let isolated = false; let sourceIndex; let fullPush = false; const exports = [];
for (let i = 0; i < split; i++) {
  if (argv[i] === '--node-version') version = argv[++i];
  else if (argv[i] === '--export') exports.push(argv[++i]);
  else if (argv[i] === '--source-index') {
    if (sourceIndex !== undefined || !isAbsolute(argv[i + 1] ?? '')) throw new Error('Invalid or duplicate source index');
    sourceIndex = argv[++i];
  }
  else if (argv[i] === '--isolated-ci') isolated = true;
  else if (argv[i] === '--full-push') {
    if (fullPush) throw new Error('Duplicate full-push control');
    fullPush = true;
  }
  else throw new Error(`Unknown runner option: ${argv[i]}`);
}
if (isolated && (process.env.GITHUB_ACTIONS !== 'true'
    || process.env.RUNNER_ENVIRONMENT !== 'github-hosted' || !isAbsolute(process.env.RUNNER_TEMP ?? '')
    || !existsSync(process.env.RUNNER_TEMP) || !/^\d+$/.test(process.env.GITHUB_RUN_ID ?? '')
    || !/^[\w-]+$/.test(process.env.GITHUB_JOB ?? ''))) throw new Error('Isolated CI requires an owned GitHub-hosted job VM');
const worker = isolated ? `${WORKER}-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_JOB}` : WORKER;
exports.forEach(validateExportPath);
const image = imageName(version); requireFree(root);
// Refuse an absent image. Bootstrap is explicit and separately reviewed.
const inspected = JSON.parse((await execute(['docker', 'image', 'inspect', image])).output.toString())[0];
if (inspected.Size >= 20 * 1024 ** 3) throw new Error('Toolchain exceeds project image budget');
const evidenceRoot = isolated ? join(process.env.RUNNER_TEMP, 'bijou-sealed-evidence')
  : join(homedir(), '.cache', 'bijou-sealed-tests', 'evidence');
function size(path) {
  if (!existsSync(path)) return 0;
  return readdirSync(path).reduce((total, name) => {
    const file = join(path, name); const s = lstatSync(file);
    if (s.isSymbolicLink()) throw new Error('Evidence symlink refused');
    return total + (s.isDirectory() ? size(file) : s.size);
  }, 0);
}
const retained = size(evidenceRoot);
const exportReserve = exports.length ? 64 * 1024 ** 2 : 0;
if (retained > LIMITS.retained - LIMITS.log - exportReserve) throw new Error('Retained evidence budget exhausted');
const destination = join(evidenceRoot, randomUUID()); mkdirSync(destination, { recursive: true });
let snap; let started = false;
try {
  // A busy worker refuses here, before a snapshot or a dependency install is spent on it.
  await assertWorkerFree(`${worker}-dependencies`); await assertWorkerFree(worker);
  snap = await snapshot(root, argv.slice(split + 1), await readInput(), {
    generatedBudget: 128 * 1024 ** 2 - retained - exportReserve - 22 * 1024 ** 2,
    signal: controller.signal, sourceIndex, fullPush,
  });
  const dependencyArchive = await prepareDependencies(snap, image, worker, controller.signal);
  const config = await startWorker(worker, image, 'none'); started = true;
  writeFileSync(join(destination, 'admission.json'), JSON.stringify({ sourceSha256: snap.digest,
    sourceBytes: snap.sourceBytes, archiveBytes: snap.archive.length, image: inspected.Id,
    hostFreeBytes: requireFree(root), vmAndQuotaFree: await measureWorker(worker),
    retainedBytes: retained, hostConfig: config.HostConfig, command: argv.slice(split + 1) }, null, 2));
  const mounts = await execute(['docker', 'exec', worker, 'cat', '/proc/self/mountinfo']);
  writeFileSync(join(destination, 'mountinfo.txt'), mounts.output);
  await execute(['docker', 'exec', '-i', worker, 'tar', 'xf', '-', '-C', '/work'], { input: snap.archive });
  await execute(['docker', 'exec', '-i', worker, 'tar', 'xf', '-', '-C', '/work/source'], { input: dependencyArchive });
  const relocate = "const fs=require('fs');fs.cpSync('/work/source/.npm','/home/test/.npm',{recursive:true});fs.rmSync('/work/source/.npm',{recursive:true})";
  await execute(['docker', 'exec', worker, 'node', '-e', relocate]);
  await execute(['docker', 'exec', worker, 'node', '/work/source/scripts/docker-seal/initialize.mjs']);
  const result = await execute(['docker', 'exec', '-w', '/work/source', worker, 'node', '/work/source/scripts/docker-seal/supervise.mjs'], {
    // The supervisor checks backing/quota floors and generated bytes every
    // 250 ms. Do not docker-exec another monitor into its PID namespace: its
    // cleanup deliberately kills new processes, including reparented children.
    // execute independently retains host-floor, deadline, and output limits.
    allowFailure: true, onData: (chunk) => process.stdout.write(chunk),
  });
  writeFileSync(join(destination, 'stdout.log'), result.output);
  const receipt = await execute(['docker', 'exec', worker, 'cat', '/tmp/sealed-receipt.json'], { allowFailure: true });
  writeFileSync(join(destination, 'receipt.json'), receipt.code === 0 ? receipt.output : JSON.stringify({
    admissionFailure: true, exitCode: result.code,
    reason: 'Supervisor did not publish a receipt; original failure is retained in stdout.log',
  }, null, 2));
  if (exports.length) await exportArtifacts({ worker, paths: exports, destination: join(destination, 'exports'), execute });
  process.exitCode = result.code || (receipt.code === 0 ? 0 : 2);
} catch (error) {
  writeFileSync(join(destination, 'failure.json'), JSON.stringify({
    phase: started ? 'sealed execution or artifact collection' : 'snapshot or dependency preparation',
    message: String(error).slice(-16_384),
  }, null, 2));
  throw error;
} finally {
  if (started) await stopWorker(worker);
  if (snap) rmSync(snap.directory, { recursive: true, force: true });
  process.stdout.write(`Sealed evidence: ${destination}\n`);
}

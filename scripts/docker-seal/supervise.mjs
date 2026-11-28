import './require-docker.mjs';
import { readdirSync, statfsSync, readFileSync, writeFileSync } from 'node:fs';
import { generatedBytes } from './generated-bytes.mjs';
import { spawn } from 'node:child_process';
const roots = ['/work', '/tmp', '/home/test', '/dev/shm'];
const freeFloor = 50n * 1024n ** 3n;
const stdoutLimit = 16 * 1024 ** 2;
const peak = {}; let stdoutBytes = 0; let failure;
const request = JSON.parse(readFileSync('/work/source/.seal/request.json', 'utf8'));
const existing = new Set(readdirSync('/proc').filter((name) => /^\d+$/.test(name)));
const baseline = new Map();
generatedBytes(roots, baseline, true);
function measure() {
  const backing = statfsSync('/', { bigint: true });
  if (backing.bavail * backing.bsize < freeFloor) throw new Error('VM free-space floor reached');
  for (const root of roots) {
    const f = statfsSync(root, { bigint: true });
    peak[root] = Math.max(peak[root] ?? 0, Number((f.blocks - f.bfree) * f.bsize));
    if (f.bavail * f.bsize < 1024n ** 2n) throw new Error(`Quota reserve exhausted: ${root}`);
  }
  let generated;
  try { generated = generatedBytes(roots, baseline); } catch (error) {
    throw new Error(`Sealed supervisor stopped the workload: its generated-byte measurement failed, not a test: ${error.message}`);
  }
  if (generated > request.generatedBudget) throw new Error('Conservative generated-log allowance exhausted');
}
function activeChildren() {
  return readdirSync('/proc').filter((name) => /^\d+$/.test(name) && !existing.has(name)).filter((name) => {
    try { return readFileSync(`/proc/${name}/stat`, 'utf8').split(') ')[1][0] !== 'Z'; }
    catch { return false; }
  });
}
async function quiesce() {
  const deadline = Date.now() + 5000;
  while (activeChildren().length) {
    for (const pid of activeChildren()) { try { process.kill(Number(pid), 'SIGKILL'); } catch { /* Reaped. */ } }
    if (Date.now() > deadline) throw new Error('Owned child processes did not stop');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
const env = { PATH: `/work/source/node_modules/.bin:${process.env.PATH}`, HOME: '/home/test', TMPDIR: '/tmp', LANG: 'C.UTF-8',
  GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
  npm_config_cache: '/home/test/.npm', npm_config_offline: 'true', CI: 'true',
  ...(request.fullPush === true ? { BIJOU_FULL_PUSH: '1' } : {}),
  // The worker's Vitest pool, sized with its CPUs and memory (worker-profile.mjs).
  ...(/^[1-9]\d?$/.test(process.env.BIJOU_VITEST_MAX_WORKERS ?? '')
    ? { BIJOU_VITEST_MAX_WORKERS: process.env.BIJOU_VITEST_MAX_WORKERS } : {}) };
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { failure ??= new Error(`Interrupted: ${signal}`); });
const deadline = Date.now() + 1800_000;
async function run(command, input) {
  let done = false; let code;
  const child = spawn(command[0], command.slice(1), {
    cwd: '/work/source', env, stdio: ['pipe', 'pipe', 'pipe'], detached: true,
  });
  const receive = (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes > stdoutLimit) failure ??= new Error('Output log cap exceeded');
    else process.stdout.write(chunk);
  };
  child.stdout.on('data', receive); child.stderr.on('data', receive);
  child.stdin.on('error', (error) => { if (error.code !== 'EPIPE') failure ??= error; });
  child.stdin.end(input);
  child.on('error', (error) => { failure ??= error; done = true; });
  child.on('exit', (value) => { code = value; done = true; });
  try {
    while (!done && !failure) {
      measure();
      if (Date.now() > deadline) throw new Error('Workload deadline exceeded');
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (failure) throw failure;
    return code ?? 1;
  } finally { await quiesce(); }
}
try {
  measure();
  // Lifecycle scripts execute offline and are quiesced before tests begin.
  const rebuilt = await run(['npm', 'rebuild', '--offline']);
  process.exitCode = rebuilt === 0 ? await run(request.command, readFileSync('/work/source/.seal/stdin')) : rebuilt;
} catch (error) { failure = error; process.exitCode = 2; }
finally {
  await quiesce();
  writeFileSync('/tmp/sealed-receipt.json', JSON.stringify({ peakBytes: peak, stdoutBytes,
    error: failure?.message ?? null, exitCode: process.exitCode ?? 0 }));
  if (failure) process.stderr.write(`${failure.message}\n`);
}

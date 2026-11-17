import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LIMITS, MARKER, imageName } from './constants.mjs';
import { nodeImages } from './toolchains.mjs';
import { execute, requireFree } from './process.mjs';
import { startWorker, stopWorker } from './worker.mjs';

const args = process.argv.slice(2);
let version = '22';
let base;
let isolated = false;
while (args.length) {
  const key = args.shift();
  if (key === '--node-version') version = args.shift();
  else if (key === '--base-image') base = args.shift();
  else if (key === '--isolated-ci') isolated = true;
  else throw new Error(`Unknown bootstrap option: ${key}`);
}
base ??= nodeImages[version];
if (!['20', '22', '24'].includes(version) ||
    !new RegExp(`^node:${version}-bookworm@sha256:[a-f0-9]{64}$`, 'u').test(base ?? '')) {
  throw new Error('Bootstrap requires an immutable official Node bookworm image matching the requested version');
}

const probe = 'bijou-sealed-probe';
const context = mkdtempSync(join(tmpdir(), 'bijou-seal-image-'));
let started = false;
const controller = new AbortController();
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => controller.abort());
try {
  const hostFree = requireFree(context);
  if (isolated) {
    // On an exclusive Linux CI VM the daemon backing filesystem is observable directly.
    const info = JSON.parse((await execute(['docker', 'info', '--format', '{{json .DockerRootDir}}'])).output);
    const backingFree = requireFree(info);
    const found = await execute(['docker', 'image', 'inspect', base], { allowFailure: true });
    if (found.code !== 0) {
      console.log(JSON.stringify({ operation: 'pinned-ci-toolchain-pull', base, backingFree,
        maximumGrowthBytes: 2 * 1024 ** 3, deadlineMs: 300_000 }));
      await execute(['docker', 'pull', base], { timeout: 300_000, signal: controller.signal,
        onData: (chunk) => process.stdout.write(chunk), monitor: () => {
          const free = requireFree(info);
          if (backingFree - free > 2 * 1024 ** 3) throw new Error('Toolchain pull exceeded 2 GiB growth allowance');
        } });
    }
  }
  // Local bootstrap never pulls implicitly; CI uses explicit bounded admission above.
  const image = JSON.parse((await execute(['docker', 'image', 'inspect', base])).output)[0];
  if (image.Size > 2 * 1024 ** 3) throw new Error('Toolchain exceeds the admitted 2 GiB base size');
  await startWorker(probe, base, 'none');
  started = true;
  const measure = 'const s=require("node:fs").statfsSync("/",{bigint:true});console.log(Number(s.bavail*s.bsize))';
  const vmFree = Number((await execute(['docker', 'exec', probe, 'node', '-e', measure], { timeout: 10_000 })).output);
  if (!Number.isSafeInteger(vmFree) || vmFree < LIMITS.free) throw new Error('Docker backing filesystem free-space floor not met');
  const evidence = { operation: 'toolchain-marker-bootstrap', measuredAt: new Date().toISOString(),
    image: image.Id, source: 'Dockerfile and marker only', hostFree, vmFree,
    expectedGrowthBytes: 1024 * 1024, deadlineMs: 120_000,
    limits: 'no RUN, no pull, 1 KiB context files, 16 MiB output, bounded read-only probe',
    probe, lockKeys: ['host/docker/bijou-sealed-probe/', 'host/docker/bijou-sealed-tests/'] };
  console.log(JSON.stringify(evidence));
  writeFileSync(join(context, 'Dockerfile'), `FROM ${base}\nCOPY marker /etc/bijou-test-seal\nUSER 1000:1000\nWORKDIR /work/source\nENV HOME=/home/test TMPDIR=/tmp LANG=C.UTF-8 GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null\nCMD ["sleep", "infinity"]\n`);
  writeFileSync(join(context, 'marker'), MARKER);
  await execute(['docker', 'build', '--pull=false', '--network=none', '--tag', imageName(version), context], {
    timeout: 120_000, signal: controller.signal, onData: (chunk) => process.stdout.write(chunk),
    monitor: async () => {
      const free = Number((await execute(['docker', 'exec', probe, 'node', '-e', measure], { timeout: 5000 })).output);
      if (!Number.isSafeInteger(free) || free < LIMITS.free) throw new Error('Docker free-space floor reached during bootstrap');
    },
  });
  const built = JSON.parse((await execute(['docker', 'image', 'inspect', imageName(version)])).output)[0];
  if (built.Size - image.Size > 1024 * 1024) throw new Error('Toolchain marker layer exceeded admission');
  console.log(JSON.stringify({ status: 'built', image: built.Id, tag: imageName(version), hostFree: requireFree(context) }));
} finally {
  if (started) await stopWorker(probe);
  rmSync(context, { recursive: true, force: true });
}

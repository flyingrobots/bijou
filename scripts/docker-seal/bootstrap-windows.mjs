import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, renameSync, rmSync, readdirSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execute, requireFree } from './process.mjs';
import { windowsCommand, windowsStage } from './windows-stage.mjs';
import { requireWindowsBootstrapClear, withWindowsDaemonCustody, windowsBootstrapQuarantined } from './windows-quarantine.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const MiB = 1024 ** 2;
const base = 'mcr.microsoft.com/windows/servercore:ltsc2022@sha256:301d571fc0cffed67083d4cc7a10167f551212f76b3f91eb7457e89aa5a183da';
const downloads = [
  ['node.zip', 'https://nodejs.org/dist/v22.23.3/node-v22.23.3-win-x64.zip', '2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71'],
  ['git.tar.bz2', 'https://github.com/git-for-windows/git/releases/download/v2.52.0.windows.1/Git-2.52.0-64-bit.tar.bz2', '4c05716ec90806b29d6392e6190e2277a6687688f889f0039d7ae3ca53ed433f'],
];

async function download(url, checksum, output, signal) {
  const response = await fetch(url, { signal: AbortSignal.any([AbortSignal.timeout(120000), signal]) });
  if (!response.ok || !response.body) throw new Error(`Toolchain download failed: ${response.status}`);
  const chunks = []; let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > 256 * MiB) throw new Error('Toolchain download exceeds 256 MiB');
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);
  if (createHash('sha256').update(data).digest('hex') !== checksum) throw new Error('Toolchain checksum mismatch');
  writeFileSync(output, data);
}

function measure(path, state = { entries: 0, bytes: 0 }) {
  return readdirSync(path).reduce((total, name) => {
    if (++state.entries > 100000) throw new Error('Toolchain context exceeds 100000 entries');
    const child = join(path, name); const stat = lstatSync(child);
    if (stat.isSymbolicLink()) throw new Error('Toolchain context symlink refused');
    if (stat.isDirectory()) return total + measure(child, state);
    state.bytes += stat.size;
    if (state.bytes > 1024 * MiB) throw new Error('Toolchain context exceeds 1 GiB');
    return total + stat.size;
  }, 0);
}

/** Prepare a checksum-pinned Windows toolchain image without host lifecycle work. */
export async function bootstrapWindows(version) {
  if (process.platform !== 'win32' || version !== '22') throw new Error('Windows bootstrap requires Windows and Node 22');
  requireWindowsBootstrapClear();
  requireFree(tmpdir());
  const controller = new AbortController();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => controller.abort());
  const backing = JSON.parse((await execute(['docker', 'info', '--format', '{{json .DockerRootDir}}'])).output.toString());
  const before = requireFree(backing);
  const monitorBacking = () => {
    if (before - requireFree(backing) > 8 * 1024 ** 3) throw new Error('Windows bootstrap exceeds 8 GiB disk growth');
  };
  const cached = await execute(['docker', 'image', 'inspect', base], { allowFailure: true });
  if (cached.code !== 0) {
    await withWindowsDaemonCustody({ operation: 'pull', base, backing }, async () => {
      await windowsCommand('pull-base', ['docker', 'pull', base], { timeout: 600000, signal: controller.signal,
        monitor: monitorBacking, onData: (chunk) => process.stdout.write(chunk) });
      monitorBacking();
      const pulled = JSON.parse((await execute(['docker', 'image', 'inspect', base])).output.toString())[0];
      if (pulled.Os !== 'windows' || pulled.Size > 20 * 1024 ** 3) throw new Error('Pulled Windows image failed admission');
    });
  }
  const image = JSON.parse((await execute(['docker', 'image', 'inspect', base])).output.toString())[0];
  if (image.Os !== 'windows' || image.Size > 20 * 1024 ** 3) throw new Error('Windows base exceeds image budget or has wrong OS');
  const scratch = mkdtempSync(join(tmpdir(), 'bijou-windows-image-'));
  try {
    for (const [file, url, checksum] of downloads) {
      await windowsStage(file === 'node.zip' ? 'download-node' : 'download-git',
        () => download(url, checksum, join(scratch, file), controller.signal));
    }
    const context = join(scratch, 'context'); mkdirSync(context);
    mkdirSync(join(context, 'git'));
    let lastReport = -Infinity;
    const extraction = { timeout: 120000, signal: controller.signal, monitor: () => {
      const started = performance.now();
      const state = { entries: 0, bytes: 0 };
      try { measure(scratch, state); }
      finally {
        if (performance.now() - lastReport >= 10000) {
          process.stdout.write(`${JSON.stringify({ bootstrap: 'windows', measurement: 'extraction',
            entries: state.entries, bytes: state.bytes, elapsedMs: Math.round(performance.now() - started) })}\n`);
          lastReport = performance.now();
        }
      }
    } };
    await windowsCommand('extract-node', ['tar.exe', '-xf', join(scratch, 'node.zip'), '-C', context], extraction);
    renameSync(join(context, 'node-v22.23.3-win-x64'), join(context, 'node'));
    await windowsCommand('extract-git', ['tar.exe', '-xf', join(scratch, 'git.tar.bz2'), '-C', join(context, 'git')], extraction);
    if (measure(scratch) > 1024 * MiB) throw new Error('Windows toolchain context exceeds 1 GiB');
    copyFileSync(join(directory, 'Dockerfile.windows'), join(context, 'Dockerfile'));
    copyFileSync(join(directory, 'marker'), join(context, 'marker'));
    await withWindowsDaemonCustody({ operation: 'build', base, backing, context: scratch }, async () => {
      await windowsCommand('build-toolchain', ['docker', 'build', '--pull=false', '--tag', 'bijou-sealed-windows-node22:local', context], {
        timeout: 600000, signal: controller.signal, onData: (chunk) => process.stdout.write(chunk),
        monitor: () => { monitorBacking(); measure(scratch); },
      });
      const built = JSON.parse((await execute(['docker', 'image', 'inspect', 'bijou-sealed-windows-node22:local'])).output.toString())[0];
      if (built.Size - image.Size > 1024 * MiB) throw new Error('Windows toolchain layer exceeds 1 GiB');
      monitorBacking();
    });
  } finally {
    if (!windowsBootstrapQuarantined()) rmSync(scratch, { recursive: true, force: true });
  }
}

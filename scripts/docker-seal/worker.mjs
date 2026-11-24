import { execute } from './process.mjs';
import { OWNER } from './constants.mjs';
import { mkdirSync, writeFileSync, existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
function quarantine(name) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw new Error('Invalid worker name');
  const base = process.env.GITHUB_ACTIONS === 'true' && process.env.RUNNER_TEMP
    ? join(process.env.RUNNER_TEMP, 'bijou-sealed-custody') : join(homedir(), '.cache', 'bijou-sealed-tests');
  mkdirSync(base, { recursive: true, mode: 0o700 });
  return join(base, `${name}.json`);
}
const BUSY = 'Another sealed run is using it; wait for it to finish and run again. To queue runs, wrap the command in a lock of your choosing.';
// A marker whose recorded process is alive is a run in progress, not a wreck.
export function markerRefusal(name, marker) {
  let pid;
  try { pid = JSON.parse(readFileSync(marker, 'utf8')).pid; } catch { pid = undefined; }
  let alive = false;
  if (Number.isSafeInteger(pid) && pid > 0) {
    try { process.kill(pid, 0); alive = true; } catch (error) { alive = error.code === 'EPERM'; }
  }
  return alive ? `Worker already active: ${name} (process ${String(pid)}). ${BUSY}`
    : `Worker requires explicit recovery: ${marker}`;
}
export function workerArgs(name, image, network = 'none') {
  return ['create', '--name', name, '--label', `${OWNER}=v1`, '--init',
    '--network', network, '--read-only', '--ipc', 'private', '--shm-size', '16m',
    '--cpus', '2', '--memory', '4g', '--memory-swap', '4g', '--pids-limit', '256',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--user', '1000:1000',
    '--tmpfs', '/work:rw,exec,nosuid,nodev,size=2g,uid=1000,gid=1000',
    '--tmpfs', '/tmp:rw,exec,nosuid,nodev,size=512m,uid=1000,gid=1000',
    '--tmpfs', '/home/test:rw,exec,nosuid,nodev,size=512m,uid=1000,gid=1000',
    '--log-driver', 'local', '--log-opt', 'max-size=1m', '--log-opt', 'max-file=1', '--log-opt', 'compress=false',
    '--env', 'HOME=/home/test', '--env', 'TMPDIR=/tmp',
    '--env', 'GIT_CONFIG_NOSYSTEM=1', '--env', 'GIT_CONFIG_GLOBAL=/dev/null',
    '--env', 'npm_config_cache=/home/test/.npm', '--workdir', '/work',
    image, 'sleep', 'infinity'];
}
export async function inspectWorker(name, cleanup = false) {
  const result = await execute(['docker', 'inspect', name], { allowFailure: true, cleanup });
  if (result.code === 0) return JSON.parse(result.output.toString())[0];
  if (/No such (object|container):/i.test(result.output.toString())) return null;
  throw new Error(`Cannot establish Docker worker state: ${result.output.toString()}`);
}
export async function startWorker(name, image, network) {
  const marker = quarantine(name);
  if (existsSync(marker)) throw new Error(markerRefusal(name, marker));
  let worker = await inspectWorker(name);
  if (worker) {
    if (worker.Config.Labels?.[OWNER] !== 'v1') throw new Error(`Refusing unowned worker ${name}`);
    if (worker.State.Running) throw new Error(`Worker already active: ${name}. ${BUSY}`);
    const imageId = JSON.parse((await execute(['docker', 'image', 'inspect', image])).output)[0].Id;
    if (worker.Image !== imageId) throw new Error('Existing worker image changed; explicit owned-worker migration required');
  } else {
    await execute(['docker', ...workerArgs(name, image, network)]);
    worker = await inspectWorker(name);
  }
  const c = worker.HostConfig;
  const expectedTmpfs = {
    '/work': 'rw,exec,nosuid,nodev,size=2g,uid=1000,gid=1000',
    '/tmp': 'rw,exec,nosuid,nodev,size=512m,uid=1000,gid=1000',
    '/home/test': 'rw,exec,nosuid,nodev,size=512m,uid=1000,gid=1000',
  };
  if (worker.Mounts.length || c.Binds?.length || c.NetworkMode !== network || !c.ReadonlyRootfs
      || c.Privileged || !c.Init || c.PidMode || c.IpcMode !== 'private'
      || c.Memory !== 4 * 1024 ** 3 || c.MemorySwap !== c.Memory || c.NanoCpus !== 2e9
      || c.PidsLimit !== 256 || c.ShmSize !== 16 * 1024 ** 2
      || c.CapDrop?.join() !== 'ALL' || !c.SecurityOpt?.includes('no-new-privileges')
      || c.CapAdd?.length || c.Devices?.length || c.DeviceRequests?.length
      || worker.Config.User !== '1000:1000' || worker.Config.WorkingDir !== '/work'
      || worker.Config.Cmd?.join() !== 'sleep,infinity'
      || Object.keys(c.Tmpfs).sort().join() !== '/home/test,/tmp,/work'
      || Object.entries(expectedTmpfs).some(([key, value]) => c.Tmpfs[key] !== value)
      || c.LogConfig.Type !== 'local' || c.LogConfig.Config['max-size'] !== '1m'
      || c.LogConfig.Config['max-file'] !== '1' || c.LogConfig.Config.compress !== 'false') {
    throw new Error('Existing worker fails required isolation profile');
  }
  writeFileSync(marker, JSON.stringify({ name, image, createdAt: new Date().toISOString(), pid: process.pid }), { flag: 'wx', mode: 0o600 });
  await execute(['docker', 'start', name]);
  try { await measureWorker(name); }
  catch (error) { await stopWorker(name); throw error; }
  return worker;
}
export async function measureWorker(name) {
  const script = "const fs=require('fs');for(const p of ['/', '/work','/tmp','/home/test','/dev/shm']){const s=fs.statfsSync(p,{bigint:true});const n=s.bavail*s.bsize;if(n<(p==='/'?50n*1024n**3n:1024n**2n))throw Error('Storage floor '+p);console.log(p+' '+n)}";
  return (await execute(['docker', 'exec', name, 'node', '-e', script], { timeout: 10_000 })).output.toString();
}
export async function stopWorker(name) {
  const worker = await inspectWorker(name, true);
  if (!worker) { if (existsSync(quarantine(name))) unlinkSync(quarantine(name)); return; }
  if (worker.Config.Labels?.[OWNER] !== 'v1') throw new Error('Cannot stop unowned worker');
  if (worker.State.Running) {
    try { await execute(['docker', 'stop', '--time', '2', name], { timeout: 15_000, cleanup: true }); }
    catch { await execute(['docker', 'kill', name], { timeout: 15_000, cleanup: true }); }
  }
  if ((await inspectWorker(name, true))?.State.Running) throw new Error('Worker still running; quarantine remains for explicit recovery');
  if (existsSync(quarantine(name))) unlinkSync(quarantine(name));
}

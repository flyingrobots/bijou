import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

function quarantinePath() {
  const root = process.env.RUNNER_TEMP;
  if (!root || !isAbsolute(root) || !existsSync(root)) throw new Error('Windows bootstrap custody requires RUNNER_TEMP');
  return join(root, 'bijou-sealed-windows-quarantine.json');
}

export function requireWindowsBootstrapClear() {
  const path = quarantinePath();
  if (existsSync(path)) throw new Error(`Windows Docker bootstrap custody is uncertain; inspect retained quarantine before reuse: ${path}`);
}

export function windowsBootstrapQuarantined() { return existsSync(quarantinePath()); }

/** A killed CLI is not evidence that the Docker daemon stopped writing. */
export async function withWindowsDaemonCustody(details, operation) {
  requireWindowsBootstrapClear();
  const path = quarantinePath();
  writeFileSync(path, JSON.stringify({ ...details, pid: process.pid, startedAt: new Date().toISOString(),
    state: 'daemon-operation-in-progress' }), { flag: 'wx' });
  // Deliberately no finally deletion: failure, cancellation or process death
  // leaves a refusal marker and the owned context for explicit recovery.
  const result = await operation();
  unlinkSync(path);
  return result;
}

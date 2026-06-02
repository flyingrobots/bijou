import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), 'check-node-version.mjs');

function runCheck(version: string) {
  return spawnSync(process.execPath, [scriptPath, '--version', version], {
    encoding: 'utf8',
  });
}

describe('check-node-version preinstall gate', () => {
  it.each(['v20.19.0', 'v20.20.0', 'v22.12.0', 'v23.0.0', 'v24.1.0', 'v26.0.0'])('allows supported Node %s', (version) => {
    const result = runCheck(version);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it.each(['v16.20.0', 'v17.9.1', 'v18.20.8', 'v20.18.1', 'v21.7.3', 'v22.11.0', 'not-a-version'])(
    'rejects unsupported Node %s',
    (version) => {
      const result = runCheck(version);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Unsupported Node.js ${version}`);
      expect(result.stderr).toContain('use Node.js 20.19 or newer, or Node.js 22.12 or newer');
    },
  );
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readNetworkEntries } from './network-entries.mjs';

const roots: string[] = [];

/** Lay out a `/sys/class/net` lookalike: a directory per device, a file per control entry. */
function netRoot(devices: Readonly<Record<string, string>>, files: readonly string[] = []): string {
  const root = mkdtempSync(join(tmpdir(), 'bijou-net-'));
  roots.push(root);
  for (const [name, flags] of Object.entries(devices)) {
    mkdirSync(join(root, name));
    writeFileSync(join(root, name, 'flags'), flags);
  }
  for (const name of files) writeFileSync(join(root, name), '');
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('network entry facts', () => {
  it('reports whether each device is administratively up', () => {
    const root = netRoot({ lo: '0x9\n', tunl0: '0x80\n', eth0: '0x1003\n' });
    expect(readNetworkEntries(root)).toEqual([
      { name: 'eth0', device: true, up: true },
      { name: 'lo', device: true, up: true },
      { name: 'tunl0', device: true, up: false },
    ]);
  });

  it('reports a control file as an entry that is not a device', () => {
    const root = netRoot({ lo: '0x9\n' }, ['bonding_masters']);
    expect(readNetworkEntries(root)).toEqual([
      { name: 'bonding_masters', device: false, up: false },
      { name: 'lo', device: true, up: true },
    ]);
  });

  it.each(['', 'unknown\n', '-1\n'])('treats unreadable flags %j as up', (flags) => {
    expect(readNetworkEntries(netRoot({ tunl0: flags }))).toEqual([{ name: 'tunl0', device: true, up: true }]);
  });

  it('treats a device with no flags attribute as up', () => {
    const root = netRoot({});
    mkdirSync(join(root, 'tunl0'));
    expect(readNetworkEntries(root)).toEqual([{ name: 'tunl0', device: true, up: true }]);
  });

  it.skipIf(process.platform !== 'linux')('reads the running kernel, where loopback is up', () => {
    expect(readNetworkEntries()).toContainEqual({ name: 'lo', device: true, up: true });
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readNetworkEntries, type NetworkEntry } from './network-entries.mjs';
import { verifyKernelSeal, type KernelSealFacts } from './seal-policy.mjs';

/** Use the admitted worker's real mount table, not an invented Docker topology. */
function admittedFacts(): KernelSealFacts {
  return {
    dockerFile: true,
    marker: readFileSync('/etc/bijou-test-seal', 'utf8'),
    sockets: [],
    interfaces: readNetworkEntries(),
    mountInfo: readFileSync('/proc/self/mountinfo', 'utf8'),
  };
}

const LOOPBACK: NetworkEntry = { name: 'lo', device: true, up: true };

/** The entries Docker Desktop's kernel lists in a worker started with no network. */
const FALLBACK_ENTRIES: readonly NetworkEntry[] = [
  { name: 'bonding_masters', device: false, up: false },
  ...['erspan0', 'gre0', 'gretap0', 'ip6_vti0', 'ip6gre0', 'ip6tnl0', 'ip_vti0', 'sit0', 'tunl0']
    .map((name) => ({ name, device: true, up: false })),
];

describe.skipIf(process.platform !== 'linux')('kernel test seal', () => {
  it('admits the actual sealed worker', () => {
    expect(() => { verifyKernelSeal(admittedFacts()); }).not.toThrow();
  });

  it.each([
    ['Docker identity', { dockerFile: false }, 'missing /.dockerenv'],
    ['image identity', { marker: 'bijou-test-seal-v1' }, 'invalid image seal'],
    ['network isolation', { interfaces: [LOOPBACK, { name: 'eth0', device: true, up: true }] }, 'network interface'],
    ['Docker socket', { sockets: ['/run/docker.sock'] }, 'Docker socket'],
  ] as const)('rejects a broken %s boundary', (_name, mutation, reason) => {
    expect(() => { verifyKernelSeal({ ...admittedFacts(), ...mutation }); }).toThrow(reason);
  });

  it('admits a worker whose kernel lists down fallback tunnel devices', () => {
    const interfaces = [LOOPBACK, ...FALLBACK_ENTRIES];
    expect(() => { verifyKernelSeal({ ...admittedFacts(), interfaces }); }).not.toThrow();
  });

  it.each([
    ['a fallback tunnel device that is up', { name: 'tunl0', device: true, up: true }],
    ['a down device that is not a fallback tunnel', { name: 'eth0', device: true, up: false }],
    ['a control file other than bonding_masters', { name: 'tunl0', device: false, up: false }],
    ['a device named like the bonding control file', { name: 'bonding_masters', device: true, up: false }],
  ] as const)('rejects %s', (_name, entry) => {
    const interfaces = [LOOPBACK, entry];
    expect(() => { verifyKernelSeal({ ...admittedFacts(), interfaces }); }).toThrow('network interface beyond loopback');
  });

  it.each(['/work', '/tmp', '/home/test'])('requires independent tmpfs at %s', (path) => {
    const facts = admittedFacts();
    const mountInfo = facts.mountInfo.split('\n').filter((line) => line.split(' ')[4] !== path).join('\n');
    expect(() => { verifyKernelSeal({ ...facts, mountInfo }); }).toThrow(`${path} must be an independent tmpfs`);
  });

  it('rejects an extra filesystem mounted beneath the source', () => {
    const facts = admittedFacts();
    const mountInfo = `${facts.mountInfo.trim()}\n999 1 8:1 /host /work/source/escape rw - ext4 /dev/sda rw\n`;
    expect(() => { verifyKernelSeal({ ...facts, mountInfo }); }).toThrow('unexpected mount at /work/source/escape');
  });

  it('rejects a writable Docker init executable mount', () => {
    const facts = admittedFacts();
    const mountInfo = facts.mountInfo.split('\n').map((line) => {
      const fields = line.split(' ');
      if (fields[4] === '/usr/sbin/docker-init') fields[5] = 'rw';
      return fields.join(' ');
    }).join('\n');
    expect(facts.mountInfo).toContain(' /usr/sbin/docker-init ');
    expect(() => { verifyKernelSeal({ ...facts, mountInfo }); }).toThrow('unexpected mount at /usr/sbin/docker-init');
  });

  it('rejects a writable root even when the image marker matches', () => {
    const facts = admittedFacts();
    const mountInfo = facts.mountInfo.split('\n').map((line) => {
      const fields = line.split(' ');
      if (fields[4] === '/') fields[5] = 'rw';
      return fields.join(' ');
    }).join('\n');
    expect(() => { verifyKernelSeal({ ...facts, mountInfo }); }).toThrow('read-only overlay');
  });
});

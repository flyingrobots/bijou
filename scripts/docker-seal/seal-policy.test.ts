import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { verifyKernelSeal, type KernelSealFacts } from './seal-policy.mjs';

/** Use the admitted worker's real mount table, not an invented Docker topology. */
function admittedFacts(): KernelSealFacts {
  return {
    dockerFile: true,
    marker: readFileSync('/etc/bijou-test-seal', 'utf8'),
    sockets: [],
    interfaces: readdirSync('/sys/class/net'),
    mountInfo: readFileSync('/proc/self/mountinfo', 'utf8'),
  };
}

describe.skipIf(process.platform !== 'linux')('kernel test seal', () => {
  it('admits the actual sealed worker', () => {
    expect(() => { verifyKernelSeal(admittedFacts()); }).not.toThrow();
  });

  it.each([
    ['Docker identity', { dockerFile: false }, 'missing /.dockerenv'],
    ['image identity', { marker: 'bijou-test-seal-v1' }, 'invalid image seal'],
    ['network isolation', { interfaces: ['lo', 'eth0'] }, 'network interface'],
    ['Docker socket', { sockets: ['/run/docker.sock'] }, 'Docker socket'],
  ] as const)('rejects a broken %s boundary', (_name, mutation, reason) => {
    expect(() => { verifyKernelSeal({ ...admittedFacts(), ...mutation }); }).toThrow(reason);
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

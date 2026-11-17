import { describe, expect, it } from 'vitest';
import { probeQuota, quotaProbeProgram, quotaProbeUsers } from './windows-quota-probe.mjs';

describe('Windows quota probe', () => {
  it('reports the facts that each worker identity returns', async () => {
    // Oracle: hosted job 133877886551 reported only "Access is denied." for the quota change.
    const asked: string[] = [];
    const run = (user: string, program: string): Promise<string> => {
      asked.push(program === quotaProbeProgram ? user : `${user} with another program`);
      return Promise.resolve(` user=${user} | fsutil-modify=1 Error:  Access is denied.\r\n`);
    };
    await expect(probeQuota(run)).resolves.toBe([
      'quota probe as ContainerAdministrator: user=ContainerAdministrator | fsutil-modify=1 Error:  Access is denied.',
      'quota probe as NT AUTHORITY\\SYSTEM: user=NT AUTHORITY\\SYSTEM | fsutil-modify=1 Error:  Access is denied.',
    ].join('\n'));
    expect(asked).toEqual(['ContainerAdministrator', 'NT AUTHORITY\\SYSTEM']);
  });

  it('reports a probe that cannot run and still asks the next identity', async () => {
    const run = (user: string): Promise<string> => (user === 'ContainerAdministrator'
      ? Promise.reject(new Error('docker exited 1: no such user'))
      : Promise.resolve('user=system'));
    await expect(probeQuota(run)).resolves.toBe([
      'quota probe as ContainerAdministrator: probe failed: docker exited 1: no such user',
      'quota probe as NT AUTHORITY\\SYSTEM: user=system',
    ].join('\n'));
  });

  it('probes as the default worker user and as the system account', () => {
    expect(quotaProbeUsers).toEqual(['ContainerAdministrator', 'NT AUTHORITY\\SYSTEM']);
  });

  it.each([
    ['the identity', 'user=$(whoami)'],
    ['the enabled privileges', "whoami /priv /fo csv"],
    ['the fsutil change', 'fsutil quota modify C: 4227858432 4294967296 $name'],
    ['the quota state', 'fsutil quota query C:'],
    ['the disk quota API change', '$u.QuotaLimit=4294967296'],
  ])('asks the worker for %s', (_name, fragment) => {
    expect(quotaProbeProgram).toContain(fragment);
  });

  it('never asks for a limit other than the 4 GiB hard quota', () => {
    // Harvest every number of seven or more digits; only the threshold and the limit may appear.
    const numbers = quotaProbeProgram.match(/\d{7,}/g) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    expect(new Set(numbers)).toEqual(new Set(['4227858432', '4294967296']));
  });
});

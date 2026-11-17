import { describe, expect, it } from 'vitest';
import { hostQuotaProbeProgram, hyperVQuotaProbeProgram, probeHostQuota, probeHyperVQuota, probeQuota, quotaProbeProgram, quotaProbeUsers } from './windows-quota-probe.mjs';

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

describe('Windows host quota probe', () => {
  const volume = '\\\\?\\Volume{11111111-2222-3333-4444-555555555555}\\';

  it('reports what the host answers about the worker volume', async () => {
    // Oracle: hosted job 133886801117 showed that no identity inside the worker can change or read the entries.
    const asked: string[] = [];
    const run = (program: string): Promise<string> => { asked.push(program); return Promise.resolve('host-user=runner\r\n api-open=ok state=2\r\n'); };
    await expect(probeHostQuota(volume, run)).resolves.toBe('quota probe on the host: host-user=runner | api-open=ok state=2');
    expect(asked).toEqual([hostQuotaProbeProgram(volume)]);
  });

  it('reports a host probe that cannot run', async () => {
    const run = (): Promise<string> => Promise.reject(new Error('powershell exited 1'));
    await expect(probeHostQuota(volume, run)).resolves.toBe('quota probe on the host: probe failed: powershell exited 1');
  });

  it.each([
    ['a drive root', 'D:'],
    ['a quoted volume', "\\\\?\\Volume{11111111-2222-3333-4444-555555555555}\\'; Remove-Item x; '"],
    ['an empty name', ''],
  ])('refuses to build a program for %s', (_name, value) => {
    expect(() => hostQuotaProbeProgram(value)).toThrow('Host quota probe needs a volume GUID path');
  });

  it.each([
    ['the worker volume', `$volume='${volume}'`],
    ['the account name on the host', "SecurityIdentifier 'S-1-5-93-2-2'"],
    ['the fsutil answer', 'fsutil quota query $volume'],
    ['the disk quota API change', '$u.QuotaLimit=4294967296'],
    ['the entries it can read', 'foreach($entry in $q)'],
  ])('asks the host for %s', (_name, fragment) => {
    expect(hostQuotaProbeProgram(volume)).toContain(fragment);
  });

  it('prints each fact when the host answers, so a probe that stops later keeps the earlier facts', () => {
    // Oracle: hosted job 133892406817 lost the whole host report; the worker removal failed after it.
    const program = hostQuotaProbeProgram(volume);
    expect(program).not.toContain('$facts');
    expect(program.match(/Write-Host /g)?.length).toBeGreaterThanOrEqual(8);
  });

  it('never asks the host for a limit other than the 4 GiB hard quota', () => {
    // Harvest every number of seven or more digits outside the volume name.
    const numbers = hostQuotaProbeProgram(volume).replace(volume, '').match(/\d{7,}/g) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    expect(new Set(numbers)).toEqual(new Set(['4227858432', '4294967296']));
  });
});

describe('Windows Hyper-V quota probe', () => {
  it('reports how a Hyper-V isolated worker answers the same quota probe', async () => {
    // Oracle: hosted job 133911265792 showed that neither a process-isolated worker nor the host can set the entry.
    const asked: string[] = [];
    const run = (program: string): Promise<string> => { asked.push(program); return Promise.resolve('fsutil-enforce=0\r\n user=x | fsutil-modify=0\r\n'); };
    await expect(probeHyperVQuota(run)).resolves.toBe('quota probe in a Hyper-V worker: fsutil-enforce=0 | user=x | fsutil-modify=0');
    expect(asked).toEqual([hyperVQuotaProbeProgram]);
  });

  it('enforces quotas on the new volume, then asks the worker probe questions', () => {
    expect(hyperVQuotaProbeProgram.startsWith('$out=(fsutil quota enforce C: 2>&1 | Out-String).Trim();')).toBe(true);
    expect(hyperVQuotaProbeProgram.endsWith(quotaProbeProgram)).toBe(true);
  });

  it('reports a Hyper-V worker that cannot start', async () => {
    const run = (): Promise<string> => Promise.reject(new Error('docker exited 125: hypervisor is not present'));
    await expect(probeHyperVQuota(run))
      .resolves.toBe('quota probe in a Hyper-V worker: probe failed: docker exited 125: hypervisor is not present');
  });
});

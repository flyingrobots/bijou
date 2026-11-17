import { describe, expect, it } from 'vitest';
import { win32 } from 'node:path';
import { validateWindowsWorker, type WindowsWorkerInspection } from './windows-policy.mjs';

// Docker inspect is the runner's external admission boundary. These records test
// its policy; only the native Windows CI lane can verify the Engine's behaviour.
function worker(): WindowsWorkerInspection {
  return {
    Config: { Labels: { 'org.bijou.sealed-tests': 'windows-v1' } },
    Mounts: [],
    HostConfig: { NetworkMode: 'none', CpuCount: 2, Memory: 6 * 1024 ** 3, StorageOpt: { size: '8G' }, Isolation: 'process' },
    NetworkSettings: { Networks: { none: {} } },
  };
}

describe('Windows worker admission', () => {
  it('admits the bounded offline profile', () => {
    expect(() => { validateWindowsWorker(worker(), true); }).not.toThrow();
  });

  it('rejects a named pipe mounted from the host', () => {
    const candidate = { ...worker(), Mounts: [{ Type: 'npipe', Source: '\\\\.\\pipe\\docker_engine' }] };
    expect(() => { validateWindowsWorker(candidate, true); }).toThrow('isolation profile');
  });

  it('rejects a host bind before Docker resolves it into Mounts', () => {
    const candidate = worker();
    const bind = `${win32.join('C:', '/', 'host')}:${win32.join('C:', '/', 'work')}`;
    const attached = { ...candidate, HostConfig: { ...candidate.HostConfig, Binds: [bind] } };
    expect(() => { validateWindowsWorker(attached, true); }).toThrow('isolation profile');
  });

  it('refuses a dependency network at test admission', () => {
    const candidate = { ...worker(), NetworkSettings: { Networks: { none: {}, nat: {} } } };
    expect(() => { validateWindowsWorker(candidate, true); }).toThrow('isolation profile');
  });

  it('admits NAT only during dependency preparation', () => {
    const original = worker();
    const candidate = { ...original, HostConfig: { ...original.HostConfig, NetworkMode: 'nat' }, NetworkSettings: { Networks: { nat: {} } } };
    expect(() => { validateWindowsWorker(candidate, false); }).not.toThrow();
  });

  it.each([
    { CpuCount: 0 },
    { Memory: 0 },
    { StorageOpt: {} },
    { SecurityOpt: [['credentialspec=file:', '//domain.json'].join('')] },
  ])('refuses an unbounded or credentialed host configuration: %j', (change) => {
    const candidate = worker();
    expect(() => { validateWindowsWorker({ ...candidate, HostConfig: { ...candidate.HostConfig, ...change } }, true); }).toThrow('isolation profile');
  });
});

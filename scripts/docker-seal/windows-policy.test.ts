import { describe, expect, it } from 'vitest';
import { win32 } from 'node:path';
import { validateWindowsWorker, type WindowsWorkerInspection } from './windows-policy.mjs';

// Docker inspect is the runner's external admission boundary. These records test
// its policy; only the native Windows CI lane can verify the Engine's behaviour.
function worker(): WindowsWorkerInspection {
  return {
    Config: { Labels: { 'org.bijou.sealed-tests': 'windows-v1' } },
    Mounts: [],
    HostConfig: { NetworkMode: 'none', CpuCount: 2, Memory: 6 * 1024 ** 3, Isolation: 'process' },
    NetworkSettings: { Networks: { none: {} } },
  };
}

describe('Windows worker admission', () => {
  it.each([['the size that Docker accepted and did not enforce', { size: '8G' }], ['a larger size', { size: '64G' }]])(
    'refuses a storage option, which can only enlarge the worker volume: %s',
    (_name, StorageOpt) => {
      // Oracle: hosted job 135323118345, where size=8G left a 21339549696 byte volume.
      const candidate = worker();
      expect(() => { validateWindowsWorker({ ...candidate, HostConfig: { ...candidate.HostConfig, StorageOpt } }, true); }).toThrow('isolation profile');
    },
  );

  it('admits an empty storage option record', () => {
    const candidate = worker();
    expect(() => { validateWindowsWorker({ ...candidate, HostConfig: { ...candidate.HostConfig, StorageOpt: {} } }, true); }).not.toThrow();
  });

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
    { SecurityOpt: [['credentialspec=file:', '//domain.json'].join('')] },
  ])('refuses an unbounded or credentialed host configuration: %j', (change) => {
    const candidate = worker();
    expect(() => { validateWindowsWorker({ ...candidate, HostConfig: { ...candidate.HostConfig, ...change } }, true); }).toThrow('isolation profile');
  });
});

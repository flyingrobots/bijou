import { describe, expect, it } from 'vitest';
import { win32 } from 'node:path';
import { validateWindowsWorker, type WindowsWorkerInspection } from './windows-policy.mjs';

function hostConfig(StorageOpt?: Readonly<Record<string, string>>) {
  return {
    NetworkMode: 'none', CpuCount: 2, Memory: 6 * 1024 ** 3, Isolation: 'process',
    ...(StorageOpt === undefined ? {} : { StorageOpt }),
  };
}

// Docker inspect is the runner's external admission boundary. These records test
// its policy; only the native Windows CI lane can verify the Engine's behaviour.
function worker(): WindowsWorkerInspection {
  return {
    Config: { Labels: { 'org.bijou.sealed-tests': 'windows-v1' } },
    Mounts: [],
    HostConfig: hostConfig({ size: '20G' }),
    NetworkSettings: { Networks: { none: {} } },
  };
}

describe('Windows worker admission', () => {
  it.each([
    ['no storage option, which leaves the 127 GB default volume', undefined],
    ['an empty storage option record', {}],
    ['a size that Docker raises to its 20 GB minimum', { size: '8G' }],
    ['a larger size', { size: '64G' }],
    ['an extra storage option', { size: '20G', other: '1' }],
  ])('refuses %s', (_name, StorageOpt) => {
    // Oracle: hosted job 135334072019 measured 136229920768 bytes with no option; job 135323118345 measured 21339549696 with size=8G.
    expect(() => { validateWindowsWorker({ ...worker(), HostConfig: hostConfig(StorageOpt) }, true); }).toThrow('isolation profile');
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

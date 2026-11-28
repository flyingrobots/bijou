import { describe, expect, it } from 'vitest';
import { GiB } from './constants.mjs';
import { dockerWorkerProfile, parseDockerCapacity, workerProfile } from './worker-profile.mjs';

describe('sealed worker profile', () => {
  it('keeps a 4-CPU GitHub runner at the 2 CPUs and 2 Vitest workers it always had', () => {
    expect(workerProfile(4, 16 * GiB)).toEqual({ cpus: 2, memoryGiB: 8, memoryBytes: 8 * GiB, vitestWorkers: 2 });
  });

  it('gives a 10-CPU workstation with a 7.8 GiB Docker VM 8 CPUs, 5 GiB and 5 Vitest workers', () => {
    // 8392671232 bytes is what Docker Desktop reports for an 8 GB VM.
    expect(workerProfile(10, 8_392_671_232)).toEqual({ cpus: 8, memoryGiB: 5, memoryBytes: 5 * GiB, vitestWorkers: 5 });
  });

  it('never drops below the old fixed size of 2 CPUs and 4 GiB', () => {
    expect(workerProfile(2, 4 * GiB)).toEqual({ cpus: 2, memoryGiB: 4, memoryBytes: 4 * GiB, vitestWorkers: 2 });
  });

  it('caps a large host at 8 CPUs and 8 GiB', () => {
    expect(workerProfile(64, 256 * GiB)).toEqual({ cpus: 8, memoryGiB: 8, memoryBytes: 8 * GiB, vitestWorkers: 8 });
  });

  it('refuses unknown capacity instead of guessing', () => {
    expect(() => workerProfile(0, 8 * GiB)).toThrow(/capacity is unknown/);
    expect(() => workerProfile(Number.NaN, 8 * GiB)).toThrow(/capacity is unknown/);
    expect(() => workerProfile(4, 1024)).toThrow(/capacity is unknown/);
  });

  it('parses docker info capacity and rejects anything else', () => {
    expect(parseDockerCapacity('10 8392671232\n')).toEqual({ cpus: 10, memoryBytes: 8_392_671_232 });
    expect(() => parseDockerCapacity('')).toThrow(/Unexpected docker info/);
    expect(() => parseDockerCapacity('10 lots')).toThrow(/Unexpected docker info/);
  });

  it('asks docker info for exactly the CPU count and total memory', async () => {
    const calls: (readonly string[])[] = [];
    const profile = await dockerWorkerProfile((argv) => {
      calls.push(argv);
      return Promise.resolve({ output: Buffer.from('10 8392671232\n') });
    });

    expect(calls).toEqual([['docker', 'info', '--format', '{{.NCPU}} {{.MemTotal}}']]);
    expect(profile.cpus).toBe(8);
  });
});

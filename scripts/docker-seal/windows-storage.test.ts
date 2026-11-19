import { describe, expect, it } from 'vitest';
import { parseWorkerStorage, storageContract, storageMeasureProgram } from './windows-storage.mjs';

const GiB = 1024 ** 3;
const answer = (value: unknown): string => `${JSON.stringify(value)}\r\n`;

describe('Windows worker storage measurement', () => {
  it('reads the capacity, the used space and the process count that the worker reports', () => {
    // Oracle: hosted job 135323118345 measured a 21339549696 byte worker volume.
    const output = answer({ capacityBytes: 21339549696, freeBytes: 21298413568, processes: 12 });
    expect(parseWorkerStorage(output)).toEqual({ capacityBytes: 21339549696, usedBytes: 41136128, processes: 12 });
  });

  it('refuses a worker volume larger than the demonstrated 20 GiB boundary', () => {
    const output = answer({ capacityBytes: 20 * GiB + 1, freeBytes: GiB, processes: 12 });
    // Oracle: hosted job 135329759013 refused a worker and did not say how large its volume was.
    expect(() => parseWorkerStorage(output)).toThrow('Windows worker storage boundary exceeds 20 GiB: capacity 21474836481 bytes, free 1073741824 bytes');
  });

  it.each([
    ['no capacity', { freeBytes: 1, processes: 1 }],
    ['a zero capacity', { capacityBytes: 0, freeBytes: 0, processes: 1 }],
    ['no free space figure', { capacityBytes: GiB, processes: 1 }],
    ['more free space than capacity', { capacityBytes: GiB, freeBytes: GiB + 1, processes: 1 }],
    ['a capacity given as text', { capacityBytes: '21339549696', freeBytes: 1, processes: 1 }],
    ['no process count', { capacityBytes: GiB, freeBytes: 1 }],
    ['a list', [1, 2, 3]],
    ['null', null],
  ])('refuses an answer with %s instead of substituting zero', (_name, value) => {
    expect(() => parseWorkerStorage(answer(value))).toThrow('Windows worker storage measurement unavailable');
  });

  it('refuses output that is not JSON', () => {
    expect(() => parseWorkerStorage('Access is denied.')).toThrow('Windows worker storage measurement unavailable');
  });

  it.each([
    ['the worker volume capacity', 'capacityBytes=$drive.TotalSize'],
    ['the free space', 'freeBytes=$drive.AvailableFreeSpace'],
    ['the process count', 'processes=@(Get-Process).Count'],
  ])('asks the worker for %s', (_name, fragment) => {
    expect(storageMeasureProgram).toContain(fragment);
  });
});

describe('Windows storage contract for receipts', () => {
  it('names the enforcement as a volume capacity and the accounting as sampled', () => {
    expect(storageContract.enforcement).toMatch(/^hard: /);
    expect(storageContract.accounting).toMatch(/^sampled: /);
    expect(storageContract.maximumCapacityBytes).toBe(20 * GiB);
  });

  it('claims no per-account quota and no 8 GiB boundary', () => {
    // Oracle: the same job showed that a requested 8G size left a 21339549696 byte volume.
    const text = JSON.stringify(storageContract);
    expect(text).not.toMatch(/quota/i);
    expect(text).not.toMatch(/\b8 ?G/i);
  });
});

import { describe, expect, it } from 'vitest';
import { judgeStorageProbe, storageProbeProgram } from './windows-storage-probe.mjs';

const GiB = 1024 ** 3;
const requestedBytes = 8 * GiB;
const report = (...lines: string[]): string => lines.join('\r\n');
/** Bytes as text: a count of GiB, less some bytes. */
const b = (gib: number, less = 0): string => String(gib * GiB - less);

describe('Windows storage boundary verdict', () => {
  it('accepts a full-disk refusal that leaves no room, at the capacity that was requested', () => {
    // Oracle: 0x80070070 is ERROR_DISK_FULL, the refusal of an allocation by the volume itself.
    const verdict = judgeStorageProbe(report(
      `capacity=${b(8)} free=${b(7)} user=user manager\\containeruser`,
      `written=${b(4)} free=${b(3)}`,
      `outcome=refused written=${b(7, 1024)} hresult=80070070 free=1024 message=There is not enough space on the disk.`,
    ), requestedBytes);
    expect(verdict).toEqual({
      verdict: 'boundary-at-requested-size', requestedBytes, capacityBytes: 8 * GiB, freeAtStartBytes: 7 * GiB,
      writtenBytes: 7 * GiB - 1024, freeAtEndBytes: 1024, hresult: '80070070', user: 'user manager\\containeruser',
    });
  });

  it('reports a larger real capacity as larger, never as the requested size', () => {
    const verdict = judgeStorageProbe(report(
      `capacity=${b(20)} free=${b(19)} user=user manager\\containeruser`,
      `outcome=refused written=${b(19)} hresult=80070070 free=0 message=There is not enough space on the disk.`,
    ), requestedBytes);
    expect(verdict.verdict).toBe('boundary-above-requested-size');
    expect(verdict.capacityBytes).toBe(20 * GiB);
  });

  it.each([
    ['its own byte ceiling', `outcome=ceiling written=${b(9)} free=${b(11)}`, 'ceiling-reached'],
    ['a permission failure', 'outcome=refused written=0 hresult=80070005 free=7516192768 message=Access is denied.', 'refused-for-another-reason'],
    ['a refusal that leaves room on the volume', `outcome=refused written=${b(1)} hresult=80070070 free=${b(6)} message=x`, 'refused-for-another-reason'],
    ['a writer that stopped with no outcome', `written=${b(2)} free=${b(5)}`, 'incomplete'],
  ])('does not count %s as the storage boundary', (_name, last, expected) => {
    const verdict = judgeStorageProbe(report(`capacity=${b(8)} free=${b(7)} user=u`, last), requestedBytes);
    expect(verdict.verdict).toBe(expected);
  });

  it('keeps the last progress of a writer that stopped with no outcome', () => {
    const verdict = judgeStorageProbe(report(`capacity=${b(8)} free=${b(7)} user=u`, `written=${b(1)} free=${b(6)}`,
      `written=${b(2)} free=${b(5)}`), requestedBytes);
    expect(verdict.writtenBytes).toBe(2 * GiB);
    expect(verdict.freeAtEndBytes).toBe(5 * GiB);
  });

  it.each([['an empty report', ''], ['a report with no capacity', 'outcome=ceiling written=1 free=1'], ['a capacity that is not a number', 'capacity=big free=1 user=u']])(
    'refuses %s instead of reporting zero',
    (_name, output) => {
      expect(() => judgeStorageProbe(output, requestedBytes)).toThrow('Storage probe reported no capacity');
    },
  );
});

describe('Windows storage probe program', () => {
  const program = storageProbeProgram(24 * GiB);

  it.each([
    ['the capacity and the identity before it writes', 'Write-Host "capacity=$($drive.TotalSize) free=$($drive.AvailableFreeSpace) user=$(whoami)"'],
    ['data that cannot be stored sparsely', '(New-Object System.Random 1).NextBytes($chunk)'],
    ['each write to reach the disk', '$stream.Flush($true)'],
    ['its independent byte ceiling', `[Math]::Min($drive.TotalSize + 1073741824, ${b(24)})`],
    ['the refusal code', "hresult=$('{0:x8}' -f $failure.HResult)"],
  ])('asks the worker for %s', (_name, fragment) => {
    expect(program).toContain(fragment);
  });

  it.each([['zero', 0], ['a fraction', 1.5], ['more than 32 GiB', 33 * GiB]])('refuses a ceiling of %s', (_name, ceiling) => {
    expect(() => storageProbeProgram(ceiling)).toThrow('Storage probe ceiling must be a whole number of bytes up to 32 GiB');
  });
});

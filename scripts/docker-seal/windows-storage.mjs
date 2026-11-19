const GiB = 1024 ** 3;
const maximumCapacityBytes = 20 * GiB;
const unavailable = 'Windows worker storage measurement unavailable';

/** PowerShell that reports the worker volume's capacity and free space, and the process count. */
export const storageMeasureProgram = "$ErrorActionPreference='Stop'; $drive=New-Object System.IO.DriveInfo 'C'; "
  + '@{ capacityBytes=$drive.TotalSize; freeBytes=$drive.AvailableFreeSpace; processes=@(Get-Process).Count } | ConvertTo-Json -Compress';

/**
 * What the receipts may claim about Windows worker storage. The worker volume
 * is the hard limit; Docker does not shrink it below its default size. The
 * usage budgets are sampled observations, not a per-account limit.
 */
export const storageContract = Object.freeze({
  enforcement: 'hard: the worker volume refuses writes when it is full; its capacity is measured in the worker and must not exceed maximumCapacityBytes',
  maximumCapacityBytes,
  demonstration: 'hosted job 135323118345: a worker volume of 21339549696 bytes refused writes with ERROR_DISK_FULL after 21273509888 bytes',
  accounting: 'sampled: growth of used space on the worker volume, and decreases of free space on the host filesystem that holds Docker storage; the larger is charged against each budget',
  limits: 'use between two samples can be missed; the host counter also counts other activity on that filesystem',
});

/** Validate the worker's answer. A missing or impossible figure is refused, never read as zero. */
export function parseWorkerStorage(output) {
  let answer;
  try { answer = JSON.parse(output); } catch { throw new Error(unavailable); }
  if (answer === null || typeof answer !== 'object' || Array.isArray(answer)) throw new Error(unavailable);
  const { capacityBytes, freeBytes, processes } = answer;
  if (!Number.isSafeInteger(capacityBytes) || capacityBytes <= 0 || !Number.isSafeInteger(freeBytes) || freeBytes < 0
      || freeBytes > capacityBytes || !Number.isSafeInteger(processes)) throw new Error(unavailable);
  if (capacityBytes > maximumCapacityBytes) {
    throw new Error(`Windows worker storage boundary exceeds 20 GiB: capacity ${String(capacityBytes)} bytes, free ${String(freeBytes)} bytes`);
  }
  return { capacityBytes, usedBytes: capacityBytes - freeBytes, processes };
}

const GiB = 1024 ** 3;
const chunkBytes = 64 * 1024 ** 2;
const programHead = "$ErrorActionPreference='Stop'; $drive=New-Object System.IO.DriveInfo 'C'; Write-Host \"capacity=$($drive.TotalSize) free=$($drive.AvailableFreeSpace) user=$(whoami)\"; $ceiling=[Math]::Min($drive.TotalSize + 1073741824, ";
const programTail = "); $chunk=New-Object byte[] 67108864; (New-Object System.Random 1).NextBytes($chunk); $written=[long]0; $directory=Join-Path $env:TEMP 'storage-probe'; New-Item -ItemType Directory -Force $directory | Out-Null; $index=0; try { while($written -lt $ceiling) { $stream=[System.IO.File]::Open((Join-Path $directory \"$index.bin\"), [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write); try { for($part=0; $part -lt 16 -and $written -lt $ceiling; $part++) { $stream.Write($chunk, 0, $chunk.Length); $stream.Flush($true); $written+=$chunk.Length } } finally { $stream.Dispose() }; $index++; Write-Host \"written=$written free=$($drive.AvailableFreeSpace)\" }; Write-Host \"outcome=ceiling written=$written free=$($drive.AvailableFreeSpace)\" } catch { $failure=$_.Exception.GetBaseException(); Write-Host \"outcome=refused written=$written hresult=$('{0:x8}' -f $failure.HResult) free=$($drive.AvailableFreeSpace) message=$($failure.Message)\" }";

/**
 * PowerShell that fills the worker's volume with allocated data until the
 * volume refuses a write or the probe's own ceiling stops it, and prints its
 * progress as it goes.
 */
export function storageProbeProgram(ceilingBytes) {
  if (!Number.isSafeInteger(ceilingBytes) || ceilingBytes <= 0 || ceilingBytes > 32 * GiB) {
    throw new Error('Storage probe ceiling must be a whole number of bytes up to 32 GiB');
  }
  return `${programHead}${String(ceilingBytes)}${programTail}`;
}

/**
 * Decide what a storage probe report shows. Only a full-disk refusal that
 * leaves no room counts as the storage boundary, and the boundary is reported
 * at the capacity the worker measured, not at the size that was requested.
 */
export function judgeStorageProbe(output, requestedBytes) {
  const lines = output.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  const start = lines.find((line) => line.startsWith('capacity='));
  const capacityBytes = count(start, 'capacity');
  const freeAtStartBytes = count(start, 'free');
  if (capacityBytes === null || freeAtStartBytes === null) throw new Error('Storage probe reported no capacity');
  const outcome = lines.find((line) => line.startsWith('outcome='));
  const last = outcome ?? lines.filter((line) => line.startsWith('written=')).at(-1);
  const freeAtEndBytes = count(last, 'free') ?? freeAtStartBytes;
  const hresult = /(?:^| )hresult=([0-9a-f]{8})(?: |$)/u.exec(outcome ?? '')?.[1] ?? null;
  return {
    verdict: verdict(outcome, hresult, freeAtEndBytes, capacityBytes, requestedBytes),
    requestedBytes, capacityBytes, freeAtStartBytes,
    writtenBytes: count(last, 'written') ?? 0, freeAtEndBytes, hresult,
    user: / user=(.*)$/u.exec(start ?? '')?.[1] ?? '',
  };
}

function verdict(outcome, hresult, freeAtEndBytes, capacityBytes, requestedBytes) {
  if (outcome === undefined) return 'incomplete';
  if (outcome.startsWith('outcome=ceiling')) return 'ceiling-reached';
  // 0x80070070 is ERROR_DISK_FULL; less than two chunks of room means the volume itself was full.
  if (hresult !== '80070070' || freeAtEndBytes >= 2 * chunkBytes) return 'refused-for-another-reason';
  return capacityBytes <= requestedBytes ? 'boundary-at-requested-size' : 'boundary-above-requested-size';
}

function count(line, key) {
  const text = new RegExp(`(?:^| )${key}=(\\d+)(?: |$)`, 'u').exec(line ?? '')?.[1];
  return text === undefined ? null : Number(text);
}
